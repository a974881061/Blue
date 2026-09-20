/**
 * i百联 - 每日签到（多账号版）
 *
 * 功能：支持多账号循环签到赚积分（每日 +1，连续签到递增，7 天档最高 5 积分）。
 *       账号1 由 GetToken 脚本自动抓取，其他账号在 BoxJS 手动填写凭证 JSON。
 *       Token 为非 JWT 格式，无法检测过期；签到失败提示凭证无效时，重新打开 App 触发抓取即可。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=ibailian_signin.js, tag=i百联签到, enabled=true, timeout=30
 *
 * BoxJS 可配置项：
 * - IBL_AccountCount  账号数量（默认 1）
 * - IBL_Creds_1       账号1 凭证 JSON（自动抓取，含 membertoken/devicekey/smDeviceid）
 * - IBL_Creds_2       账号2 凭证 JSON（手动填写）
 * - IBL_Creds_3       账号3 凭证 JSON（手动填写）
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
var accountCount = parseInt($persistentStore.read("IBL_AccountCount")) || 1;

// === 结果汇总 ===
var results = [];

// === 单账号签到 ===
function signInAccount(index, callback) {
  var storeKey = "IBL_Creds_" + index;
  var raw = $persistentStore.read(storeKey);
  var label = "账号" + index;

  if (!raw) {
    results.push(label + ": 未配置凭证");
    callback();
    return;
  }

  var creds;
  try {
    creds = JSON.parse(raw);
  } catch (e) {
    results.push(label + ": 凭证格式错误");
    callback();
    return;
  }

  var token = creds.membertoken;
  if (!token) {
    results.push(label + ": 缺少 membertoken");
    callback();
    return;
  }

  // 执行签到（headers、body 复刻自抓包）
  var url = "https://mh5.bl.com/h5_gateway/signIn/submitSignInv2.htm";
  var body = "{\"channelId\":1,\"buId\":\"3000\",\"shopId\":\"-1\"}";
  var headers = {
    "content-type": "application/json",
    "channelid": "1",
    "chnflg": "app-h5",
    "membertoken": token,
    "origin": "https://mh5.bl.com",
    "referer": "https://mh5.bl.com/bl-front-end/pages/mypoints/myPoints?hidebar=true&blappversion=9.20.0",
    "Accept-Encoding": "gzip,compress,br,deflate",
    "Connection": "keep-alive",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 djAppVersion=9.20.0 iBailian",
    "Content-Length": "43",
    "Host": "mh5.bl.com"
  };
  if (creds.devicekey) headers["devicekey"] = creds.devicekey;
  if (creds.smDeviceid) headers["sm-deviceid"] = creds.smDeviceid;

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
        if (parsed.resCode === "00100000") {
          // obj 是二次转义的 JSON 字符串
          var obj = {};
          try { obj = JSON.parse(parsed.obj); } catch (e2) {}
          if (obj.signStatus === "1") {
            msg = "今日已签到";
          } else {
            msg = "签到成功，获得 " + (obj.signPoint || "?") + " 积分，连续 " + (obj.keepDays || "?") + " 天";
          }
        } else {
          var inner = {};
          try { inner = JSON.parse(parsed.obj); } catch (e3) {}
          msg = inner.errMsg || parsed.errMsg || parsed.msg || parsed.message || ("resCode " + (parsed.resCode || ("Status " + response.status)));
        }
      } catch (e) {
        msg = response.status === 200 ? "签到成功（响应解析失败）" : ("Status " + response.status);
      }
      results.push(label + ": " + msg);
    }
    callback();
  });
}

// === 顺序执行所有账号 ===
var currentIndex = 1;

function processNext() {
  if (currentIndex > accountCount) {
    var summary = results.join("\n");
    notify("i百联签到", "共 " + accountCount + " 个账号", summary);
    finish();
    return;
  }

  signInAccount(currentIndex, function () {
    currentIndex++;
    processNext();
  });
}

processNext();
