/**
 * 华润通 - 每日签到（多账号版）
 *
 * 功能：回放抓取的加密请求体完成签到。
 *       账号1 由 GetToken 脚本自动抓取，其他账号需手动在 BoxJS 填写加密 body。
 *
 * 注意：华润通签到 API 使用全加密 body，凭证有效期有限。
 *       如果签到失败（如返回错误码），需要重新打开小程序签到页面触发凭证更新。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=hrt_signin.js, tag=华润通签到, enabled=true, timeout=60
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
var accountCount = parseInt($persistentStore.read("HRT_AccountCount")) || 1;
var results = [];

// === 单账号签到 ===
function signInAccount(index, callback) {
  var storeKey = "HRT_Body_" + index;
  var body = $persistentStore.read(storeKey);
  var label = "账号" + index;

  if (!body) {
    results.push(label + ": 未配置签到凭证");
    callback();
    return;
  }

  var url = "https://mid.huaruntong.cn/api/points/saveQuestionSignin";
  var headers = {
    "content-type": "application/json;charset=utf-8",
    "accept": "application/json, text/plain, */*",
    "origin": "https://cloud.huaruntong.cn",
    "x-hrt-mid-newrisk": "newRisk",
    "x-hrt-mid-appid": "API_AUTH_WEB",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.76(0x18004c2a) NetType/4G Language/zh_CN miniProgram/wx66c62601b987e69d",
    "Referer": "https://cloud.huaruntong.cn/",
    "Host": "mid.huaruntong.cn"
  };

  $httpClient.post({
    url: url,
    timeout: 10000,
    headers: headers,
    body: body
  }, function (errormsg, response, data) {
    if (errormsg) {
      results.push(label + ": 请求异常 - " + errormsg);
    } else {
      var msg = "";
      var code = "";
      try {
        var parsed = JSON.parse(data);
        msg = parsed.msg || "";
        code = parsed.code || "";
      } catch (e) {}

      if (response.status === 200 && code === "S0A00000") {
        results.push(label + ": " + msg + " (积分+" + (JSON.parse(data).data && JSON.parse(data).data.point || "?") + ")");
      } else if (code === "S0A00000") {
        results.push(label + ": " + msg);
      } else {
        var failInfo = msg || ("Status " + response.status + " Code " + code);
        results.push(label + ": " + failInfo + "（凭证可能已过期，请重新打开小程序）");
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
    notify("华润通签到", "共 " + accountCount + " 个账号", summary);
    finish();
    return;
  }

  signInAccount(currentIndex, function () {
    currentIndex++;
    processNext();
  });
}

processNext();
