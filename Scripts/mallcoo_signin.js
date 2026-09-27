/**
 * mallcoo 猫酷商场系统 - 每日签到（通用版，支持多商场多域名）
 *
 * 支持的商场系统域名：
 *   - m.mallcoo.cn (龙之梦等)
 *   - m-crm.joycity.mobi (大悦城等)
 *
 * 功能：自动读取已抓取 Token 的商场列表，逐个执行签到。
 *       Token 由 mallcoo_gettoken.js 自动抓取并维护。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=mallcoo_signin.js, tag=mallcoo签到, enabled=true, timeout=120
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

var STORE_PREFIX = "MALLCOO_";
var MALL_LIST_KEY = "MALLCOO_MallList";

// 默认商场列表（如果没有动态列表时使用）
var DEFAULT_MALLS = [
  { mallId: "12626", name: "龙之梦城市生活中心", domain: "m.mallcoo.cn" },
  { mallId: "10024", name: "静安大悦城", domain: "m-crm.joycity.mobi" }
];

// 读取商场列表
function loadMalls() {
  var listStr = $persistentStore.read(MALL_LIST_KEY);
  if (listStr) {
    try {
      var list = JSON.parse(listStr);
      if (list && list.length > 0) {
        // 补充域名信息
        for (var i = 0; i < list.length; i++) {
          if (!list[i].domain) {
            var savedDomain = $persistentStore.read(STORE_PREFIX + "Domain_" + list[i].mallId);
            if (savedDomain) {
              list[i].domain = savedDomain;
            }
          }
          if (!list[i].name) {
            var savedName = $persistentStore.read(STORE_PREFIX + "Name_" + list[i].mallId);
            if (savedName) {
              list[i].name = savedName;
            } else {
              list[i].name = "商场" + list[i].mallId;
            }
          }
          // 读取 Token
          var token = $persistentStore.read(STORE_PREFIX + "Token_" + list[i].mallId);
          list[i].token = token || "";
        }
        return list;
      }
    } catch (e) {}
  }

  // 回退到默认列表，检查哪些有 Token
  var result = [];
  for (var j = 0; j < DEFAULT_MALLS.length; j++) {
    var mall = DEFAULT_MALLS[j];
    var token = $persistentStore.read(STORE_PREFIX + "Token_" + mall.mallId);
    if (token) {
      result.push({
        mallId: mall.mallId,
        name: mall.name,
        domain: mall.domain,
        token: token
      });
    }
  }
  return result;
}

var malls = loadMalls();
var results = [];
var currentIndex = 0;

// === 单商场签到 ===
function signInMall(index, callback) {
  var mall = malls[index];
  var token = mall.token;
  var label = mall.name || ("商场" + mall.mallId);
  var domain = mall.domain;

  if (!token) {
    results.push(label + ": 未配置 Token，请打开小程序签到页自动获取");
    callback();
    return;
  }

  if (!domain) {
    results.push(label + ": 未配置域名");
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
    url: "https://" + domain + "/api/user/User/CheckinV2",
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
            reward = "签到成功";
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
    if (malls.length === 0) {
      sub = "未配置任何商场";
      body = "请先打开对应小程序的签到页，自动获取Token后再使用";
    }
    notify(title, sub, body);
    finish();
    return;
  }

  signInMall(currentIndex, function () {
    currentIndex++;
    // 延迟一下再请求下一个
    setTimeout(next, 1500);
  });
}

console.log("mallcoo 签到 - 已配置 " + malls.length + " 个商场");
next();
