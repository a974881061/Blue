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

// 环境检测（Loon 环境优先）
var isLoon = (typeof $loon !== "undefined");
var isSurge = (typeof $httpClient !== "undefined") && !isLoon;

function notify(title, sub, body) {
  if (typeof $notification !== "undefined" && $notification.post) {
    $notification.post(title, sub, body);
  } else if (typeof $notify === "function") {
    $notify(title, sub, body);
  }
}

var STORE_PREFIX = "MALLCOO_";
var MALL_LIST_KEY = "MALLCOO_MallList";

// 默认商场列表（如果没有动态列表时使用）
var DEFAULT_MALLS = [
  { mallId: "12626", name: "龙之梦城市生活中心", domain: "m.mallcoo.cn" },
  { mallId: "10024", name: "静安大悦城", domain: "m-crm.joycity.mobi" }
];

// 读取商场列表
function loadMalls() {
  var listStr = "";
  try {
    listStr = $persistentStore.read(MALL_LIST_KEY);
  } catch (e) {
    console.log("读取商场列表失败: " + e.message);
  }

  if (listStr) {
    try {
      var list = JSON.parse(listStr);
      if (list && list.length > 0) {
        var result = [];
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          var mallId = item.mallId;
          if (!mallId) continue;

          var domain = item.domain;
          if (!domain) {
            try {
              domain = $persistentStore.read(STORE_PREFIX + "Domain_" + mallId);
            } catch (e) {}
          }

          var name = item.name;
          if (!name) {
            try {
              name = $persistentStore.read(STORE_PREFIX + "Name_" + mallId);
            } catch (e) {}
            if (!name) {
              name = "商场" + mallId;
            }
          }

          var token = "";
          try {
            token = $persistentStore.read(STORE_PREFIX + "Token_" + mallId) || "";
          } catch (e) {}

          result.push({
            mallId: mallId,
            name: name,
            domain: domain || "",
            token: token
          });
        }
        if (result.length > 0) {
          return result;
        }
      }
    } catch (e) {
      console.log("解析商场列表失败: " + e.message);
    }
  }

  // 回退到默认列表，检查哪些有 Token
  var result = [];
  for (var j = 0; j < DEFAULT_MALLS.length; j++) {
    var mall = DEFAULT_MALLS[j];
    var token = "";
    try {
      token = $persistentStore.read(STORE_PREFIX + "Token_" + mall.mallId) || "";
    } catch (e) {}
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

var malls = [];
try {
  malls = loadMalls();
} catch (e) {
  console.log("加载商场列表异常: " + e.message);
}

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

  console.log("开始签到: " + label);

  $httpClient.post({
    url: "https://" + domain + "/api/user/User/CheckinV2",
    timeout: 10000,
    headers: headers,
    body: body
  }, function (error, response, data) {
    if (error) {
      console.log(label + " 请求异常: " + error);
      results.push(label + ": 请求异常 - " + error);
    } else {
      try {
        var parsed = JSON.parse(data);
        var code = parsed.m;
        var msg = parsed.e || "";
        var d = parsed.d || {};

        if (code === 1) {
          var reward = "";
          if (d.Msg) {
            reward = d.Msg;
          } else if (d.Notice) {
            reward = d.Notice;
          } else {
            reward = "签到成功";
          }
          console.log(label + " 签到成功: " + reward);
          results.push(label + ": ✅ " + reward);
        } else if (code === 2054 || (msg && (msg.indexOf("已经签到") >= 0 || msg.indexOf("已签到") >= 0))) {
          console.log(label + " 今日已签到");
          results.push(label + ": ℹ️ 今日已签到");
        } else if (code === 401 || code === 403 || (msg && (msg.indexOf("登录") >= 0 || msg.indexOf("token") >= 0 || msg.indexOf("Token") >= 0))) {
          console.log(label + " Token已过期: " + msg);
          results.push(label + ": ⚠️ Token已过期，请重新打开小程序获取");
        } else {
          console.log(label + " 签到失败: code=" + code + ", msg=" + msg);
          results.push(label + ": ❌ 失败(" + code + ") " + msg);
        }
      } catch (e) {
        console.log(label + " 解析失败: " + e.message);
        results.push(label + ": 解析失败 - " + e.message);
      }
    }
    callback();
  });
}

// === 串行执行所有商场 ===
function next() {
  if (currentIndex >= malls.length) {
    var title = "mallcoo 签到结果";
    var sub = "共 " + malls.length + " 个商场";
    var body = results.join("\n");
    if (malls.length === 0) {
      sub = "未配置任何商场";
      body = "请先打开对应小程序的签到页，自动获取Token后再使用";
    }
    try {
      notify(title, sub, body);
    } catch (e) {
      console.log("发送通知失败: " + e.message);
    }
    $done();
    return;
  }

  try {
    signInMall(currentIndex, function () {
      currentIndex++;
      setTimeout(next, 1500);
    });
  } catch (e) {
    console.log("执行任务异常: " + e.message);
    results.push("执行异常: " + e.message);
    currentIndex++;
    setTimeout(next, 1500);
  }
}

console.log("mallcoo 签到脚本启动，已配置 " + malls.length + " 个商场");
next();
