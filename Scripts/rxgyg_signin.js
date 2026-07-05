/**
 * 徐汇日月光 - 每日签到
 *
 * 功能：定时调用签到接口，签到前检测 Token 是否即将过期并提醒。
 * Token 由 GetToken 脚本自动抓取并存入 $persistentStore。
 *
 * Loon [Script] 配置：
 * cron "0 8 * * *" script-path=rxgyg_signin.js, tag=日月光签到, enabled=true, timeout=30
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

// 从 persistentStore 读取 Token（由 GetToken 脚本自动写入）
var STORE_KEY = "RXGYG_Token";
var expireWarningHours = parseFloat($persistentStore.read("RXGYG_ExpireWarning")) || 6;
var savedToken = $persistentStore.read(STORE_KEY);

if (!savedToken) {
  notify("徐汇日月光签到", "缺少 Token", "请先打开小程序触发 Token 抓取脚本");
  finish();
} else {

  // === JWT 过期检测 ===
  var payload = null;
  try {
    var parts = savedToken.split(".");
    if (parts.length >= 2) {
      var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4 !== 0) b64 += "=";
      payload = JSON.parse(atob(b64));
    }
  } catch (e) {}

  if (payload && payload.exp) {
    var nowSec = Math.floor(Date.now() / 1000);
    var remainSec = payload.exp - nowSec;
    var remainHour = Math.round(remainSec / 3600 * 10) / 10;

    if (remainSec <= 0) {
      notify("徐汇日月光签到", "Token 已过期", "请打开小程序刷新 Token 后重试");
      finish();
    } else if (remainHour <= expireWarningHours) {
      notify("日月光 Token", "即将过期（剩余 " + remainHour + " 小时）", "请尽快打开小程序刷新 Token");
    }
  }

  // === 执行签到 ===
  var url = "https://asemp.cjtzn.com/api/user/memberSign/sign";
  var headers = {
    "content-type": "application/json",
    "Referer": "https://servicewechat.com/wxa54b6089da3daefa/71/page-frame.html",
    "token": savedToken,
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
      notify("徐汇日月光签到", "请求异常", "" + errormsg);
    } else {
      var bodyPreview = (data || "").slice(0, 500);
      if (response.status === 200) {
        notify("徐汇日月光签到", "签到成功", bodyPreview);
      } else {
        var msg = "Status: " + response.status;
        try {
          var parsed = JSON.parse(data);
          if (parsed.msg) msg = parsed.msg;
          else if (parsed.message) msg = parsed.message;
        } catch (e) {}
        notify("徐汇日月光签到", "签到失败 (" + response.status + ")", msg + (bodyPreview ? "\n" + bodyPreview : ""));
      }
    }
    finish();
  });
}
