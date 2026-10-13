#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
yyb 微信小程序签到通用引擎（青龙，标准库实现，零依赖）

工作模式：
  1. apps.json 里声明每个小程序的 appid / 登录与签到接口 / 请求模板 / 成功判定；
  2. 经 yyb-go integration API（Bearer 鉴权）发现全部 status=alive 的微信账号并循环；
  3. 每个「应用 × 账号」的业务 token 以 JSON 持久化到 yyb_tokens.json，过期或被服务端
     判失效时，自动经 yyb 取 wx.login code 重新登录，全程无需手动抓 token。

隐私约定（哪些不能进仓库）：
  - YYB_INTEGRATION_TOKEN：yyb-go integration 令牌，属于敏感信息。优先读环境变量
    YYB_INTEGRATION_TOKEN（青龙环境变量已配），也可放在被 .gitignore 忽略的
    yyb.local.json 里（{"integration_token": "..."}），**绝不能写进 apps.json 或提交到 git**。
  - yyb_tokens.json：运行时生成的 token 仓库，含各账号业务 token，已被 .gitignore 忽略。
  - apps.json：只放 appid、接口地址、UA、签名盐（小程序客户端内置常量，非个人隐私）。

支持的 flow：
  - wxmp_json   ：登录/签到均为 JSON POST（DT生活 这类）
  - form_rqtoken：表单 POST + rqtoken  MD5 签名（探探糖 TTT 这类）
"""
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
BJ = timezone(timedelta(hours=8))

# ---------- 文件定位 ----------

def _config_path():
    return os.environ.get("YYB_APPS_JSON") or os.path.join(HERE, "apps.json")


def _local_path():
    return os.environ.get("YYB_LOCAL_JSON") or os.path.join(HERE, "yyb.local.json")


def _store_path():
    """token 仓库位置：环境变量 > 青龙数据目录(持久且在仓库目录外) > 脚本目录"""
    env = os.environ.get("YYB_TOKEN_STORE")
    if env:
        return env
    ql_data = "/ql/data"
    if os.path.isdir(ql_data) and os.access(ql_data, os.W_OK):
        return os.path.join(ql_data, "yyb_tokens.json")
    return os.path.join(HERE, "yyb_tokens.json")


# ---------- 通用工具 ----------

def _jpath(obj, path):
    """按 a.b.c 取嵌套值，取不到返回 None"""
    cur = obj
    for part in str(path).split("."):
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            return None
    return cur


def _now_bj(fmt):
    return datetime.now(BJ).strftime(fmt)


def _render(tmpl, ctx):
    """模板值渲染：字符串 {code}/{token}/{appid} 替换；非字符串原样返回"""
    if isinstance(tmpl, str):
        return tmpl.format(**ctx)
    if isinstance(tmpl, dict):
        return {k: _render(v, ctx) for k, v in tmpl.items()}
    if isinstance(tmpl, list):
        return [_render(v, ctx) for v in tmpl]
    return tmpl


def _cond_match(resp, cond):
    """
    单条判定：
      {"path":"code","equals":9999}
      {"path":"msg","contains":"登录"}
      另可附 "also":[["msg","登录"]] 同时满足（AND）
    """
    if cond.get("path") is not None:
        val = _jpath(resp, cond["path"])
        if "equals" in cond and not _eq(val, cond["equals"]):
            return False
        if "contains" in cond and cond["contains"] not in str(val):
            return False
    for also_path, also_text in cond.get("also", []):
        if also_text not in str(_jpath(resp, also_path)):
            return False
    return True


def _eq(a, b):
    """宽松相等：先严格比，再按字符串比（兼容 '9999' 与 9999）"""
    return a == b or str(a) == str(b)


def _match_any(resp, conds):
    return any(_cond_match(resp, c) for c in (conds or []))


# ---------- token 仓库（JSON 持久化，原子写） ----------

class TokenStore:
    def __init__(self, path):
        self.path = path
        self.data = {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                self.data = json.load(f) or {}
        except FileNotFoundError:
            pass
        except Exception as e:
            print("⚠️ token 仓库读取失败(%s)，按空仓库启动: %s" % (path, e))

    def get(self, app_key, ref):
        return (self.data.get(app_key, {}).get(str(ref)) or {})

    def put(self, app_key, ref, token, expire_at):
        self.data.setdefault(app_key, {})[str(ref)] = {
            "token": token,
            "expire_at": expire_at,            # None 表示不按本地时间判失效（如 TTT 365天）
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        tmp = self.path + ".tmp"
        os.makedirs(os.path.dirname(os.path.abspath(tmp)) or ".", exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=1)
        os.replace(tmp, self.path)


# ---------- 引擎 ----------

class Engine:
    def __init__(self, app_key):
        self.app_key = app_key
        with open(_config_path(), "r", encoding="utf-8") as f:
            cfg_all = json.load(f)
        if app_key not in cfg_all.get("apps", {}):
            raise RuntimeError("apps.json 里没有应用: %s" % app_key)
        self.cfg = cfg_all["apps"][app_key]
        local = {}
        try:
            with open(_local_path(), "r", encoding="utf-8") as f:
                local = json.load(f) or {}
        except FileNotFoundError:
            pass
        self.yyb_server = (os.environ.get("YYB_SERVER")
                           or local.get("yyb_server")
                           or cfg_all.get("yyb_server")
                           or "http://yyb-go:8000").rstrip("/")
        self.token_secret = (os.environ.get("YYB_INTEGRATION_TOKEN")
                             or local.get("integration_token") or "").strip()
        self.sleep_between = float(cfg_all.get("sleep_between_accounts", 3))
        proxy = (os.environ.get("%s_SIGN_PROXY" % app_key.upper())
                 or os.environ.get("YYB_SIGN_PROXY", ""))
        # yyb-go 调用始终直连（内网/回环）；业务请求允许走代理（风控期旁路测试用）
        self._yyb_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        self._biz_opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({"http": proxy, "https": proxy} if proxy else {}))
        self.store = TokenStore(_store_path())
        self.fails = []

    # ===== yyb-go integration =====

    def _yyb_call(self, method, path, payload=None, timeout=20):
        if not self.token_secret:
            raise RuntimeError("未配置 YYB_INTEGRATION_TOKEN（青龙环境变量或 yyb.local.json）")
        headers = {"Authorization": "Bearer " + self.token_secret,
                   "Content-Type": "application/json"}
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(self.yyb_server + path, data=data,
                                     headers=headers, method=method)
        try:
            with self._yyb_opener.open(req, timeout=timeout) as r:
                body = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = json.loads(e.read().decode("utf-8")).get("msg", "")
            except Exception:
                pass
            raise RuntimeError("yyb-go %s -> HTTP %s %s" % (path, e.code, detail))
        except (urllib.error.URLError, TimeoutError) as e:
            raise RuntimeError("yyb-go %s 连接失败: %s" % (path, e))
        if body.get("code") != 0:
            raise RuntimeError("yyb-go %s 返回错误: %s" % (path, body.get("msg")))
        return body.get("data")

    def discover(self):
        """返回 [(ref, display_name)]，只取 alive；支持 *_SIGN_REFS 手动覆盖"""
        env_key = "%s_SIGN_REFS" % self.app_key.upper()
        override = os.environ.get(env_key) or os.environ.get(env_key.replace("_REFS", "_REF"))
        if override:
            refs = [x.strip() for x in override.replace("&", ",").split(",") if x.strip()]
            print("账号来源：%s 覆盖 -> %s" % (env_key, refs))
            return [(r, None) for r in refs]
        if not self.token_secret:
            raise RuntimeError("未配置 YYB_INTEGRATION_TOKEN，无法动态发现账号")
        data = self._yyb_call("GET", "/integration/accounts")
        items = (data or {}).get("items") or []
        alive = [(str(x["id"]), x.get("display_name"))
                 for x in items if str(x.get("status", "")).lower() == "alive"]
        alive.sort(key=lambda t: int(t[0]) if t[0].isdigit() else 0)
        if not alive:
            raise RuntimeError("integration 未返回任何 alive 账号（共 %d 个）" % len(items))
        print("账号来源：yyb-go integration API，alive 账号 %d 个：%s"
              % (len(alive), [r for r, _ in alive]))
        return alive

    def get_code(self, ref, retries=2):
        """经 yyb 取 wx.login code；仅对网关/频控/网络类错误重试，401/503 配置错误直接抛"""
        last = None
        for attempt in range(retries + 1):
            try:
                data = self._yyb_call("POST", "/integration/actions/get-code",
                                      {"ref": ref, "app_id": self.cfg["appid"]})
                code = (data.get("result") or {}).get("code")
                if not code:
                    raise RuntimeError("get-code 未返回 code: %s"
                                       % json.dumps(data, ensure_ascii=False)[:200])
                return code
            except Exception as e:
                last = e
                msg = str(e)
                if attempt < retries and any(
                        k in msg for k in ("429", "500", "502", "503", "504", "连接失败")):
                    print("  getCode 暂时失败(%s)，5s 后重试(%s/%s)…"
                          % (msg[:60], attempt + 1, retries))
                    time.sleep(5)
                    continue
                raise
        raise last

    # ===== 业务 HTTP =====

    def _biz_request(self, url, method, headers, body_bytes, ctype, timeout=20):
        h = dict(headers or {})
        h["Content-Type"] = ctype
        req = urllib.request.Request(url, data=body_bytes, headers=h, method=method)
        try:
            with self._biz_opener.open(req, timeout=timeout) as r:
                return r.status, json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                return e.code, json.loads(e.read().decode("utf-8"))
            except Exception:
                return e.code, {"_http_error": e.code}

    def _headers(self, ctx=None):
        return _render(self.cfg.get("headers", {}), ctx or {})

    # ===== flow: wxmp_json =====

    def _login_json(self, code):
        cfg = self.cfg
        url = cfg["base_url"].rstrip("/") + cfg["login_path"]
        body = _render(cfg.get("login_body", {}), {"code": code, "appid": cfg["appid"]})
        _, d = self._biz_request(url, cfg.get("login_method", "POST"),
                                 self._headers({"appid": cfg["appid"]}),
                                 json.dumps(body).encode("utf-8"), "application/json")
        token = _jpath(d, cfg["token_path"])
        if not token:
            raise RuntimeError("登录失败，未在 %s 取到 token: %s"
                               % (cfg["token_path"], json.dumps(d, ensure_ascii=False)[:200]))
        ttl = _jpath(d, cfg["expires_in_path"]) if cfg.get("expires_in_path") else None
        try:
            ttl = int(ttl) if ttl else int(cfg.get("default_expires_in", 172800))
        except (TypeError, ValueError):
            ttl = 172800
        # 服务端 expires_in 通常含秒；提前 1 小时视为本地过期
        expire_at = int(time.time()) + max(ttl - 3600, 300)
        return token, expire_at

    def _sign_json(self, token):
        cfg = self.cfg
        url = cfg["base_url"].rstrip("/") + cfg["sign_path"]
        body = _render(cfg.get("sign_body", {}),
                       {"token": token, "appid": cfg["appid"]})
        return self._biz_request(url, cfg.get("sign_method", "POST"),
                                 self._headers({"appid": cfg["appid"], "token": token}),
                                 json.dumps(body).encode("utf-8"), "application/json")

    # ===== flow: form_rqtoken (TTT) =====

    def _rqtoken(self, path, params):
        salt = self.cfg["salt"]
        pstr = "&".join("%s=%s" % (k, params[k]) for k in sorted(params))
        raw = "%s#%s-%s~%s" % (salt, path, pstr, _now_bj("%Y%m%d"))
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

    def _post_form(self, path, params, token=""):
        cfg = self.cfg
        params = dict(params)
        params["rqtoken"] = self._rqtoken(path, params)
        headers = self._headers({"appid": cfg["appid"], "token": token})
        headers["token"] = token
        _, d = self._biz_request(
            cfg["base_url"].rstrip("/") + path, "POST", headers,
            urllib.parse.urlencode(params).encode("utf-8"),
            "application/x-www-form-urlencoded")
        return d

    def _login_form(self, code):
        d = self._post_form(self.cfg["login_path"], {"code": code})
        ui = _jpath(d, "data.userinfo") or {}
        token = ui.get("token")
        if not token:
            raise RuntimeError("登录失败: %s" % d.get("msg"))
        return token, None  # TTT token 约 365 天，不按本地时间判失效

    def _sign_form(self, token):
        params = _render(self.cfg.get("sign_params", {}), {"date": _now_bj("%Y-%m-%d")})
        d = self._post_form(self.cfg["sign_path"], params, token)
        return 200, d

    # ===== 登录（带 JSON 持久化） =====

    def _login_flow(self, code):
        if self.cfg["flow"] == "wxmp_json":
            return self._login_json(code)
        if self.cfg["flow"] == "form_rqtoken":
            return self._login_form(code)
        raise RuntimeError("未知 flow: %s" % self.cfg["flow"])

    def ensure_token(self, ref, force=False):
        rec = self.store.get(self.app_key, ref)
        token, expire_at = rec.get("token"), rec.get("expire_at")
        if not force and token:
            if expire_at is None or time.time() < expire_at:
                return token, False
            print("  token 本地已过期，经 yyb 重新登录…")
        code = self.get_code(ref)
        token, expire_at = self._login_flow(code)
        self.store.put(self.app_key, ref, token, expire_at)
        return token, True

    # ===== 结果判定 =====

    def _classify(self, d):
        cfg = self.cfg
        if _match_any(d, cfg.get("expired")):
            return "expired"
        if _match_any(d, cfg.get("already")):
            return "already"
        if _match_any(d, cfg.get("skip")):
            return "skip"
        if _match_any(d, [cfg["success"]] if cfg.get("success") else []):
            return "success"
        return "fail"

    def _success_text(self, d):
        shows = []
        for label, path in self.cfg.get("success_show", []):
            v = _jpath(d, path)
            if v is not None:
                shows.append("%s %s" % (label, v))
        return "，".join(shows)

    # ===== 单账号 =====

    def run_one(self, ref, name, idx, total):
        label = "ref=%s" % ref + ("(%s)" % name if name else "")
        kind = self.cfg["flow"]
        sign = self._sign_json if kind == "wxmp_json" else self._sign_form
        try:
            token, refreshed = self.ensure_token(ref)
            _, d = sign(token)
            if self._classify(d) == "expired":
                print("[%s] 登录态失效，经 yyb 重登后重试…" % label)
                token, _ = self.ensure_token(ref, force=True)
                _, d = sign(token)

            result = self._classify(d)
            if result == "success":
                print("[%s] 签到成功：%s（%s）"
                      % (label, self._success_text(d) or "OK", _now_bj("%Y-%m-%d")))
            elif result == "already":
                print("[%s] 今日已签到，跳过（%s）" % (label, d.get("msg") or d.get("message") or ""))
            elif result == "skip":
                print("[%s] 跳过：%s" % (label, d.get("msg") or _jpath(d, "data") or "无需签到"))
            else:
                print("[%s] 签到返回异常: %s"
                      % (label, json.dumps(d, ensure_ascii=False)[:200]))
                self.fails.append(label)
        except Exception as e:
            print("[%s] 运行异常: %s" % (label, e))
            self.fails.append(label)
        if idx < total - 1:
            time.sleep(self.sleep_between)

    def run(self):
        accounts = self.discover()
        print("%s签到（%s）：共 %d 个账号 | token仓库 %s"
              % (self.cfg.get("name", self.app_key), self.cfg["flow"],
                 len(accounts), _store_path()))
        for i, (ref, name) in enumerate(accounts):
            self.run_one(ref, name, i, len(accounts))
        print("完成：%d 个账号，失败 %d 个%s"
              % (len(accounts), len(self.fails),
                 ("（" + "、".join(self.fails) + "）") if self.fails else ""))
        return 1 if self.fails else 0


def run_app(app_key):
    try:
        sys.exit(Engine(app_key).run())
    except Exception as e:
        print("致命错误: %s" % e)
        sys.exit(1)
