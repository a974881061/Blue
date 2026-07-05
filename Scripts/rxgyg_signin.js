/**
 * 徐汇日月光 - 每日签到（多账号版）
 *
 * 功能：支持多账号循环签到，每个账号独立 Token、独立过期检测。
 *       账号1 由 GetToken 脚本自动抓取，其他账号在 BoxJS 手动填写。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=rxgyg_signin.js, tag=日月光签到, enabled=true, timeout=60
 *
 * BoxJS 可配置项：
 * - RXGYG_AccountCount   账号数量（默认 1）
 * - RXGYG_Token_1        账号1 Token（自动抓取）
 * - RXGYG_Token_2        账号2 Token（手动填写）
 * - RXGYG_Token_3        账号3 Token（手动填写）
 * - RXGYG_ExpireWarning  Token 过期预警小时数（默认 6）
 */

const $env = (function () {
  const isLoon = typeof $loon !== "undefined";
  const isSurge = typeof $httpClient !== "undefined" && !isLoon;
  const isQX = typeof $task !== "undefined";
  return { isLoon, isSurge, isQX, isCli: isLoon || isSurge };
})();

function notify(title, sub, body) {
  if ($env.isQX && typeof $notify === "function") {
    $notify(title, sub, body);
  } else if (typeof $notification !== "undefined" && $notification.post) {
    $notification.post(title, sub, body);
  } else if (typeof $notify === "function") {
    $notify(title, sub, body);
  }
}

function finish() { $done(); }

// === 配置 ===
var accountCount = parseInt($persistentStore.read("RXGYG_AccountCount")) || 1;
var expireWarningHours = parseFloat($persistentStore.read("RXGYG_ExpireWarning")) || 6;

// 兼容旧版：如果只有 RXGYG_Token 没有 RXGYG_Token_1，自动迁移
if (accountCount >= 1 && !$persistentStore.read("RXGYG_Token_1")) {
  var oldToken = $persistentStore.read("RXGYG_Token");
  if (oldToken) {
    $persistentStore.write(oldToken, "RXGYG_Token_1");
  }
}

// === 结果汇总 ===
var results = [];
var expiredAccounts = [];

// === JWT 解析 ===
function parseJwtExp(token) {
  try {
    var parts = token.split(".");
    if (parts.length < 2) return null;
    var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    var payload = JSON.parse(atob(b64));
    return payload.exp || null;
  } catch (e) {
    return null;
  }
}

// === 单账号签到 ===
function signInAccount(index, callback) {
  var storeKey = "RXGYG_Token_" + index;
  var token = $persistentStore.read(storeKey);
  var label = "账号" + index;

  if (!token) {
    results.push(label + ": 未配置 Token");
    callback();
    return;
  }

  // JWT 过期检测
  var exp = parseJwtExp(token);
  if (exp) {
    var nowSec = Math.floor(Date.now() / 1000);
    var remainSec = exp - nowSec;
    var remainHour = Math.round(remainSec / 3600 * 10) / 10;

    if (remainSec <= 0) {
      results.push(label + ": Token 已过期");
      expiredAccounts.push(label);
      callback();
      return;
    } else if (remainHour <= expireWarningHours) {
      results.push(label + ": Token 即将过期（" + remainHour + "h）");
    }
  }

  // 执行签到
  var url = "https://asemp.cjtzn.com/api/user/memberSign/sign";
  var headers = {
    "content-type": "application/json",
    "Referer": "https://servicewechat.com/wxa54b6089da3daefa/71/page-frame.html",
    "token": token,
    "Connection": "keep-alive",
    "Accept-Encoding": "gzip,compress,br,deflate",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.75(0x18004b2f) NetType/WIFI Language/zh_CN",
    "Content-Length": "58",
    "Host": "asemp.cjtzn.com"
  };
  var body = "{\"currentMemberId\":13,\"projectId\":13,\"memberId\":257419453}";

  $httpClient.post({
    url: url,
    timeout: 5000,
    headers: headers,
    body: body
  }, function (errormsg, response, data) {
    if (errormsg) {
      results.push(label + ": 请求异常 - " + errormsg);
    } else if (response.status === 200) {
      var msg = "签到成功";
      try {
        var parsed = JSON.parse(data);
        if (parsed.msg) msg = parsed.msg;
        else if (parsed.message) msg = parsed.message;
      } catch (e) {}
      results.push(label + ": " + msg);
    } else {
      var failMsg = "Status " + response.status;
      try {
        var parsed2 = JSON.parse(data);
        if (parsed2.msg) failMsg = parsed2.msg;
        else if (parsed2.message) failMsg = parsed2.message;
      } catch (e) {}
      results.push(label + ": " + failMsg);
    }
    callback();
  });
}

// === 顺序执行所有账号 ===
var currentIndex = 1;

function processNext() {
  if (currentIndex > accountCount) {
    // 全部完成，发送汇总通知
    var summary = results.join("\n");

    if (expiredAccounts.length > 0) {
      notify("日月光签到", expiredAccounts.join("、") + " Token 已过期", summary);
    } else {
      notify("日月光签到", "共 " + accountCount + " 个账号", summary);
    }
    finish();
    return;
  }

  signInAccount(currentIndex, function () {
    currentIndex++;
    processNext();
  });
}

processNext();
