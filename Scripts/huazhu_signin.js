/**
 * 华住会签到 - 每日签到脚本（Loon cron） v2
 *
 * 原理（抓包实证）：
 *   鉴权 = 请求头 `User-Token: <token>`（华住会已改用 header 鉴权，不再接受 Cookie）。
 *   签到   GET https://appgw.huazhu.com/game/sign_in?date=<unix秒>
 *   状态   GET https://appgw.huazhu.com/game/sign_header
 *   返回 code: 200=签到成功, 5001=未到签到日期(今日已签), 5004=今日已签, 其它=失败。
 */

var TOKEN_PREFIX = "HZ_TOKEN_";
var RESULT_PREFIX = "HZ_LAST_RESULT_";
var API = "https://appgw.huazhu.com";
var MAX_SLOTS = 10;
var RETRY = 2;

var UA =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 " +
  "Chrome/114 Mobile Safari/537.36";
var REFERER = "https://cdn.huazhu.com/hzapp-signinfe/";
var ORIGIN = "https://cdn.huazhu.com";

function getToken(slot) { return $persistentStore.read(TOKEN_PREFIX + slot) || ""; }

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
    "User-Agent": UA,
    Referer: REFERER,
    Origin: ORIGIN,
    Accept: "application/json, text/plain, */*",
  };
}

function headersMinimal(token) {
  return {
    "User-Token": token,
    "User-Agent": UA,
    Accept: "application/json, text/plain, */*",
  };
}

function getRefreshedToken(resp) {
  var h = (resp && resp.headers) || {};
  var v = h["userToken"] || h["User-Token"] || h["usertoken"];
  if (!v) return null;
  if (Object.prototype.toString.call(v) === "[object Array]") v = v[0];
  v = String(v).trim();
  return v || null;
}

function apiGet(path, token, attempts, cb) {
  // 先用完整 header；若失败则用精简 header 再试一次
  var useMinimal = false;
  function doRequest(hdrs) {
    $httpClient.get({ url: API + path, headers: hdrs, timeout: 20 }, function (err, resp, data) {
      if (err) {
        if (!useMinimal) {
          useMinimal = true;
          return doRequest(headersMinimal(token));
        }
        if (attempts > 0) { return setTimeout(function () { apiGet(path, token, attempts - 1, cb); }, 3000); }
        return cb({ err: String(err) });
      }
      var code = resp.status;
      if ((code === 429 || code >= 500) && attempts > 0) {
        return setTimeout(function () { apiGet(path, token, attempts - 1, cb); }, 5000);
      }
      cb({ status: code, body: data, resp: resp });
    });
  }
  doRequest(headers(token));
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
  apiGet("/game/sign_in?date=" + date, token, RETRY, function (r) {
    if (r.err) { return cb(false, tag + " 网络异常: " + r.err + "（请检查 appgw.huazhu.com 是否可达/是否被代理）", null); }
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
