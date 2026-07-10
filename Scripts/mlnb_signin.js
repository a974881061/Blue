/**
 * 茉莉奶白 - 每日签到（多账号版）
 *
 * 功能：支持多账号循环签到。
 *       账号1 由 GetToken 脚本自动抓取，其他账号在 BoxJS 手动填写。
 *       Token 为非 JWT 格式，无法检测过期。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=mlnb_signin.js, tag=茉莉奶白签到, enabled=true, timeout=60
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
var accountCount = parseInt($persistentStore.read("MLNB_AccountCount")) || 1;

// === 结果汇总 ===
var results = [];

// === 单账号签到 ===
function signInAccount(index, callback) {
  var storeKey = "MLNB_Token_" + index;
  var token = $persistentStore.read(storeKey);
  var label = "账号" + index;

  if (!token) {
    results.push(label + ": 未配置 Token");
    callback();
    return;
  }

  var url = "https://webapi.qmai.cn/web/cmk-center/sign/takePartInSign";
  var headers = {
    "content-type": "application/json",
    "Referer": "https://servicewechat.com/wx17102e91e70c9b9b/152/page-frame.html",
    "Qm-User-Token": token,
    "store-id": "217777",
    "Accept-Encoding": "gzip,compress,br,deflate",
    "Accept-Language": "zh-CN",
    "Content-Length": "423",
    "Accept": "v=1.0",
    "Connection": "keep-alive",
    "Qm-From-Type": "catering",
    "Host": "webapi.qmai.cn",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.75(0x18004b36) NetType/WIFI Language/zh_CN",
    "Qm-From": "wechat"
  };
  var body = "{\"activityId\":\"1256313914410254337\",\"storeId\":\"217777\",\"appid\":\"wx17102e91e70c9b9b\",\"timestamp\":\"1783586966669\",\"signature\":\"A2D8106971CBDD1C300DE92D44566124\",\"v\":1,\"data\":\"mUt8eDZCemncOtF6csRxGAo3IzyCX8ScMkV1ns+2xz2LRggawWl6CRXUKwMPLR/13LhdIeLfbvUm3JaUw2V/CqQpF21SJdiT69jHemU8K6CtkK5E1m/RCXaKFXyrW45cccPSMKCv1Mrf7l9N7ZQ0eakVwJrQCKEqlIrs3vrDRfBVDUb6ztvW+tCJ4nbImpD4qLTWIHVxkXdNCOLKOpKSOxWR9+3mCbe4p8jfZvZ8kBI=\",\"version\":3}";

  $httpClient.post({
    url: url,
    timeout: 5000,
    headers: headers,
    body: body
  }, function (errormsg, response, data) {
    if (errormsg) {
      results.push(label + ": 请求异常 - " + errormsg);
    } else {
      var msg = "";
      try {
        var parsed = JSON.parse(data);
        msg = parsed.msg || parsed.message || "";
      } catch (e) {}

      if (response.status === 200 && (!msg || msg.indexOf("成功") >= 0 || msg.indexOf("已签") >= 0)) {
        results.push(label + ": " + (msg || "签到成功"));
      } else {
        var failInfo = msg || ("Status " + response.status);
        results.push(label + ": " + failInfo);
      }
    }
    callback();
  });
}

// === 顺序执行所有账号 ===
var currentIndex = 1;

function processNext() {
  if (currentIndex > accountCount) {
    var summary = results.join("\n");
    notify("茉莉奶白签到", "共 " + accountCount + " 个账号", summary);
    finish();
    return;
  }

  signInAccount(currentIndex, function () {
    currentIndex++;
    processNext();
  });
}

processNext();
