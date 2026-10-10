/**
 * DT生活小程序 - 每日签到
 *
 * 流程：查询当前积分 -> 调用签到接口 -> 再次查询积分 -> 通知结果
 *
 * 签到接口：POST /api/v2/user/userSign
 *   成功   status="ok"
 *   已签到 status="no", code="sign_401", msg="你已经签到了,无需重复签到"
 *   每次签到 +10 积分
 *
 * Loon [Script] 配置：
 * cron "30 9 * * *" script-path=dt_signin.js, tag=DT生活签到, enabled=true, timeout=60
 */

var TOKEN_KEY = "DT_LIFE_TOKEN";
var API_BASE = "https://ebeikeapi.ebeck.cn/api/v2";

var token = $persistentStore.read(TOKEN_KEY) || "";

function notify(title, sub, body) {
  if (typeof $notification !== "undefined" && $notification.post) {
    $notification.post(title, sub, body);
  } else if (typeof $notify === "function") {
    $notify(title, sub, body);
  }
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Referer": "https://servicewechat.com/wx51a2021dd921f747/297/page-frame.html",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003231) NetType/WIFI Language/zh_CN"
  };
}

// 查询积分
function getPoints() {
  return new Promise(function (resolve, reject) {
    var body = JSON.stringify({ version: "251", client: "wxmp", token: token });
    $httpClient.post({
      url: API_BASE + "/user/userPointsGoldInfo",
      headers: getHeaders(),
      body: body,
      timeout: 10000
    }, function (error, response, data) {
      if (error) {
        reject(Error("查询积分请求失败: " + error));
        return;
      }
      try {
        var parsed = JSON.parse(data);
        if (parsed.status === "ok" && parsed.data) {
          resolve(Number(parsed.data.points) || 0);
        } else {
          // token 失效等情况
          reject(Error("查询积分失败: " + (parsed.msg || parsed.code || "未知错误")));
        }
      } catch (e) {
        reject(Error("查询积分响应解析失败: " + e.message));
      }
    });
  });
}

// 签到
function doSign() {
  return new Promise(function (resolve) {
    var body = JSON.stringify({ version: "251", client: "wxmp", token: token });
    $httpClient.post({
      url: API_BASE + "/user/userSign",
      headers: getHeaders(),
      body: body,
      timeout: 10000
    }, function (error, response, data) {
      if (error) {
        resolve({ success: false, already: false, msg: "签到请求失败: " + error });
        return;
      }
      try {
        var parsed = JSON.parse(data);
        if (parsed.status === "ok") {
          var pts = parsed.data && parsed.data.points ? parsed.data.points : 10;
          resolve({ success: true, already: false, msg: "签到成功，+" + pts + " 积分" });
        } else if (parsed.code === "sign_401") {
          resolve({ success: false, already: true, msg: parsed.msg || "今日已签到" });
        } else if (parsed.code === "1001" || (parsed.msg && parsed.msg.indexOf("登录") >= 0)) {
          resolve({ success: false, already: false, msg: "Token 已过期，请重新打开 DT生活小程序" });
        } else {
          resolve({ success: false, already: false, msg: parsed.msg || ("签到失败(" + parsed.code + ")") });
        }
      } catch (e) {
        resolve({ success: false, already: false, msg: "签到响应解析失败: " + e.message });
      }
    });
  });
}

// 主流程
function main() {
  if (!token) {
    notify("DT生活签到", "未配置 Token", "请先打开 DT生活小程序任意页面，自动抓取 Token");
    $done();
    return;
  }

  console.log("[DT生活] 开始每日签到");

  var pointsBefore = 0;

  getPoints().then(function (points) {
    pointsBefore = points;
    console.log("[DT生活] 签到前积分: " + pointsBefore);
    return doSign();
  }).then(function (signResult) {
    console.log("[DT生活] 签到结果: " + signResult.msg);

    // 签到后再查一次积分
    getPoints().then(function (pointsAfter) {
      var diff = pointsAfter - pointsBefore;
      var sub, body;

      if (signResult.already) {
        sub = "今日已签到";
        body = "当前积分：" + pointsAfter;
      } else if (signResult.success) {
        sub = "签到成功，积分 +" + (diff > 0 ? diff : 10);
        body = "当前积分：" + pointsAfter;
      } else {
        sub = "签到失败";
        body = signResult.msg + "\n当前积分：" + pointsAfter;
      }

      notify("DT生活签到", sub, body);
      $done();
    }).catch(function (e) {
      // 积分复核失败，仍以签到接口结果为准
      var sub = signResult.already ? "今日已签到" : (signResult.success ? "签到成功" : "签到失败");
      notify("DT生活签到", sub, signResult.msg);
      $done();
    });
  }).catch(function (e) {
    console.log("[DT生活] 异常: " + e.message);
    // 查询积分失败，可能 token 过期，仍然尝试签到
    doSign().then(function (signResult) {
      var sub = signResult.already ? "今日已签到" : (signResult.success ? "签到成功" : "签到失败");
      notify("DT生活签到", sub, signResult.msg);
      $done();
    });
  });
}

main();
