/**
 * 华住会签到 - 每日签到脚本（Loon cron） v3
 *
 * 原理（抓包实证）：
 *   鉴权 = 请求携带 userToken（原项目用 Cookie，部分环境用 User-Token 头；这里两者都带，兼容性最好）
 *   签到   GET https://appgw.huazhu.com/game/sign_in?date=<unix秒>
 *   状态   GET https://appgw.huazhu.com/game/sign_header
 *   返回 code: 200=签到成功, 5001/5004=今日已签, 其它=失败（常见为 token 过期）
 *
 * v3 修复：
 *   - 去掉 $httpClient 的显式 timeout（Loon 该参数单位为毫秒，之前 timeout:20=20ms 导致请求被立即中断，
 *     日志显示"请求失败"，而手动重放用默认超时却成功 —— 这正是"失败但重放 OK"的根因）。
 *   - 从 $persistentStore 读出的 token 做清洗（去引号/空白/换行），避免 header 值异常。
 *   - 同时携带 Cookie 与 User-Token 头，兼容原项目抓包方式。
 */

var TOKEN_PREFIX = "HZ_TOKEN_";
var RESULT_PREFIX = "HZ_LAST_RESULT_";
var API = "https://appgw.huazhu.com";
var MAX_SLOTS = 10;
var RETRY = 3;

var UA =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 " +
  "Chrome/114 Mobile Safari/537.36";
var REFERER = "https://cdn.huazhu.com/hzapp-signinfe/";
var ORIGIN = "https://cdn.huazhu.com";

// 清洗 token：去首尾引号/空白/换行及不可见字符
function cleanToken(t) {
  if (!t) return "";
  return String(t)
    .replace(/^[\s"'`]+/, "")
    .replace(/[\s"'`]+$/, "")
    .replace(/[^\x21-\x7e]/g, "");
}

function getToken(slot) {
  return cleanToken($persistentStore.read(TOKEN_PREFIX + slot));
}

function getAllAccounts() {
  var list = [];
  for (var i = 1; i <= MAX_SLOTS; i++) {
    var t = getToken(i);
    if (t) list.push({ slot: i, token: t });
  }
  return list;
}

function headers(token) {
  return {
    "User-Token": token,
    Cookie: "userToken=" + token,
    "User-Agent": UA,
    Referer: REFERER,
    Origin: ORIGIN,
    Accept: "application/json, text/plain, */*",
  };
}

function getRefreshedToken(resp) {
  var h = (resp && resp.headers) || {};
  var v = h["userToken"] || h["User-Token"] || h["usertoken"];
  if (!v) return null;
  if (Object.prototype.toString.call(v) === "[object Array]") v = v[0];
  v = cleanToken(v);
  return v || null;
}

// 注意：不设置 timeout，使用 Loon 默认值（游玩端默认约 10s），与手动重放行为一致
function apiGet(path, token, attempts, cb) {
  $httpClient.get({ url: API + path, headers: headers(token) }, function (err, resp, data) {
    if (err) {
      if (attempts > 0) return setTimeout(function () { apiGet(path, token, attempts - 1, cb); }, 3000);
      return cb({ err: String(err) });
    }
    var st = resp.status;
    if ((st === 429 || st >= 500) && attempts > 0) {
      return setTimeout(function () { apiGet(path, token, attempts - 1, cb); }, 5000);
    }
    cb({ status: st, body: data, resp: resp });
  });
}

function fetchStatus(token, cb) {
  apiGet("/game/sign_header", token, 1, function (s) {
    try {
      var c = JSON.parse(s.body).content || {};
      cb(" 积分" + (c.memberPoint != null ? c.memberPoint : "?") +
        " 今年累计签到" + (c.yearSignInCount != null ? c.yearSignInCount : "?") + "天");
    } catch (e) {
      cb("");
    }
  });
}

function signOne(slot, token, cb) {
  var tag = "账号" + slot;
  var date = Math.floor(Date.now() / 1000);
  var url = API + "/game/sign_in?date=" + date;
  console.log("[华住]" + tag + " GET " + url);
  apiGet("/game/sign_in?date=" + date, token, RETRY, function (r) {
    if (r.err) {
      console.log("[华住]" + tag + " 网络异常: " + r.err);
      return cb(false, tag + " 网络异常: " + r.err + "（请检查 appgw.huazhu.com 是否可达/是否被代理）", null);
    }
    console.log("[华住]" + tag + " HTTP " + r.status + " body=" + String(r.body).substring(0, 200));
    if (r.status !== 200) {
      var hint = "";
      if (r.status === 429) hint = "（限流/服务器繁忙，通常次日自动恢复）";
      else if (r.status === 401 || r.status === 403) hint = "（鉴权失败，可能 token 已过期）";
      return cb(false, tag + " 请求失败 HTTP " + r.status + hint, null);
    }
    try {
      var d = JSON.parse(r.body);
      var code = d.code;
      var msg = d.message || "";
      var fresh = getRefreshedToken(r.resp);
      if (code === 200) {
        fetchStatus(token, function (stat) {
          cb(true, tag + " 签到成功" + stat, fresh);
        });
      } else if (code === 5001 || code === 5004) {
        fetchStatus(token, function (stat) {
          cb(true, tag + " 今日已签到" + stat, fresh);
        });
      } else {
        cb(false, tag + " 签到失败(code=" + code + "): " + (msg || "可能 token 已过期，请重新抓取"), fresh);
      }
    } catch (e) {
      cb(false, tag + " 响应解析失败: " + e, null);
    }
  });
}

function run() {
  var accounts = getAllAccounts();
  if (accounts.length === 0) {
    $notification.post("华住会签到", "未配置", "请先打开华住会 App/小程序抓取 userToken");
    return $done({});
  }

  var results = [];
  var allOk = true;
  var idx = 0;

  function next() {
    if (idx >= accounts.length) {
      var ok = allOk;
      $notification.post("华住会签到", ok ? "成功" : "需关注", results.join("\n"));
      return $done({});
    }
    var acc = accounts[idx++];
    signOne(acc.slot, acc.token, function (ok, summary, fresh) {
      results.push(summary);
      if (ok) {
        $persistentStore.write(summary, RESULT_PREFIX + acc.slot);
      } else {
        allOk = false;
      }
      if (fresh && fresh !== acc.token && accounts.length === 1) {
        $persistentStore.write(fresh, TOKEN_PREFIX + acc.slot);
        results.push("账号" + acc.slot + " 检测到服务端下发新 token，已自动续期保存");
      }
      setTimeout(next, 1000);
    });
  }

  next();
}

run();
