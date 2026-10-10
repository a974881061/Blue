/**
 * DT生活小程序 - 每日签到
 *
 * 直接调用签到接口，完整模拟小程序请求头。
 *
 * 签到接口：POST /api/v2/user/userSign
 *   成功   status="ok"   （data.points 为本次积分）
 *   已签到 status="no", code="sign_401", msg="你已经签到了,无需重复签到"
 *   失效   msg 含"登录失败/请重新登录"
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

// 完整模拟微信小程序请求头
function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Authorization": "Bearer " + token,
    "xweb_xhr": "1",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Referer": "https://servicewechat.com/wx51a2021dd921f747/297/page-frame.html",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003231) NetType/WIFI Language/zh_CN"
  };
}

// 签到（直接返回 Promise）
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
        resolve({ success: false, already: false, expired: false, msg: "网络请求失败: " + error });
        return;
      }
      console.log("[DT生活] 签到原始响应: " + data);
      try {
        var parsed = JSON.parse(data);
        if (parsed.status === "ok") {
          var pts = parsed.data && parsed.data.points ? parsed.data.points : 10;
          resolve({ success: true, already: false, expired: false, points: pts, msg: "签到成功，+" + pts + " 积分" });
        } else if (parsed.code === "sign_401") {
          resolve({ success: false, already: true, expired: false, msg: parsed.msg || "今日已签到" });
        } else {
          var msg = parsed.msg || ("失败(" + parsed.code + ")");
          var isExpired = msg.indexOf("登录") >= 0 || msg.indexOf("失效") >= 0 || parsed.code === "1001";
          resolve({ success: false, already: false, expired: isExpired, msg: msg });
        }
      } catch (e) {
        resolve({ success: false, already: false, expired: false, msg: "响应解析失败: " + e.message });
      }
    });
  });
}

// 查询积分（仅用于签到成功后复核，失败不影响结果）
function tryGetPoints() {
  return new Promise(function (resolve) {
    var body = JSON.stringify({ version: "251", client: "wxmp", token: token });
    $httpClient.post({
      url: API_BASE + "/user/userPointsGoldInfo",
      headers: getHeaders(),
      body: body,
      timeout: 10000
    }, function (error, response, data) {
      if (error) { resolve(null); return; }
      try {
        var parsed = JSON.parse(data);
        if (parsed.status === "ok" && parsed.data) {
          resolve(Number(parsed.data.points) || 0);
        } else {
          resolve(null);
        }
      } catch (e) {
        resolve(null);
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

  console.log("[DT生活] 开始签到，token: " + token.substring(0, 8) + "...");

  doSign().then(function (result) {
    console.log("[DT生活] 结果: " + result.msg);

    if (result.expired) {
      notify("DT生活签到", "Token 已失效", result.msg + "，请重新打开 DT生活小程序刷新 Token");
      $done();
      return;
    }

    if (result.already) {
      // 已签到，顺手查个总积分
      tryGetPoints().then(function (total) {
        notify("DT生活签到", "今日已签到", total !== null ? "当前积分：" + total : result.msg);
        $done();
      });
      return;
    }

    if (result.success) {
      tryGetPoints().then(function (total) {
        notify(
          "DT生活签到",
          "签到成功，积分 +" + result.points,
          total !== null ? "当前总积分：" + total : result.msg
        );
        $done();
      });
      return;
    }

    // 其他失败
    notify("DT生活签到", "签到失败", result.msg);
    $done();
  });
}

main();
