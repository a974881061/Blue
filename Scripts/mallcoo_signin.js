/**
 * mallcoo 商场系统 - 每日签到（龙之梦/大悦城等猫酷系统商场通用）
 *
 * 功能：支持多商场签到，Token 由 gettoken 脚本自动抓取。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=mallcoo_signin.js, tag=mallcoo签到, enabled=true, timeout=60
 */

var $env = (function () {
  var isLoon = typeof $loon !== "undefined";
  var isSurge = typeof $httpClient !== "undefined" && !isLoon;
  var isQX = typeof $task !== "undefined";
  return { isLoon: isLoon, isSurge: isSurge, isQX: isQX, isCli: isLoon || isSurge };
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
// 配置需要签到的商场列表，MallID 需要对应
// 格式：[{ mallId: "12626", name: "龙之梦" }]
var malls = [
  { mallId: "12626", name: "龙之梦城市生活中心", storeKey: "MALLCOO_Token_12626" }
];

// 如果有大悦城，添加类似配置：
// { mallId: "XXXXX", name: "静安大悦城", storeKey: "MALLCOO_Token_XXXXX" }

// 也可以从 persistentStore 读取已配置的商场列表
var customMalls = $persistentStore.read("MALLCOO_MallList");
if (customMalls) {
  try {
    malls = JSON.parse(customMalls);
  } catch (e) {}
}

var API_BASE = "https://m.mallcoo.cn";
var results = [];
var currentIndex = 0;

// === 单商场签到 ===
function signInMall(index, callback) {
  var mall = malls[index];
  var token = $persistentStore.read(mall.storeKey);
  var label = mall.name || ("商场" + mall.mallId);

  if (!token) {
    results.push(label + ": 未配置 Token，请打开小程序签到页自动获取");
    callback();
    return;
  }

  var headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003231) NetType/WIFI Language/zh_CN",
    "Referer": "https://servicewechat.com/",
    "xweb_xhr": "1",
    "Accept": "*/*"
  };

  var body = JSON.stringify({
    MallID: parseInt(mall.mallId),
    Header: {
      Token: token,
      systemInfo: {
        model: "iPhone15,3",
        SDKVersion: "3.4.5",
        system: "iOS 17.5.1",
        version: "4.1.13.83",
        miniVersion: "DZ.2.68.0.byn.2"
      }
    }
  });

  $httpClient.post({
    url: API_BASE + "/api/user/User/CheckinV2",
    timeout: 10000,
    headers: headers,
    body: body
  }, function (error, response, data) {
    if (error) {
      results.push(label + ": 请求异常 - " + error);
    } else {
      try {
        var parsed = JSON.parse(data);
        var code = parsed.m;
        var msg = parsed.e || "";
        var d = parsed.d || {};

        if (code === 1) {
          // 签到成功
          var reward = "";
          if (d.Msg) {
            reward = d.Msg;
          } else if (d.Notice) {
            reward = d.Notice;
          } else {
            reward = "签到成功 +1积分";
          }
          results.push(label + ": ✅ " + reward);
        } else if (code === 2054 || msg.indexOf("已经签到") >= 0 || msg.indexOf("已签到") >= 0) {
          // 已签到
          results.push(label + ": ℹ️ 今日已签到");
        } else if (code === 401 || code === 403 || msg.indexOf("登录") >= 0 || msg.indexOf("token") >= 0 || msg.indexOf("Token") >= 0) {
          // Token 过期
          results.push(label + ": ⚠️ Token已过期，请重新打开小程序获取");
        } else {
          results.push(label + ": ❌ 失败(" + code + ") " + msg);
        }
      } catch (e) {
        results.push(label + ": 解析失败 - " + e.message);
      }
    }
    callback();
  });
}

// === 串行执行所有商场 ===
function next() {
  if (currentIndex >= malls.length) {
    // 全部完成，发送汇总通知
    var title = "mallcoo 签到结果";
    var sub = "共 " + malls.length + " 个商场";
    var body = results.join("\n");
    notify(title, sub, body);
    finish();
    return;
  }

  signInMall(currentIndex, function () {
    currentIndex++;
    // 延迟一下再请求下一个
    setTimeout(next, 1000);
  });
}

next();
