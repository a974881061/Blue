/**
 * 亚一金店 - 每日签到（每日抽奖领积分），多账号
 *
 * 活动：亚一签到有礼（sceneGameInstanceCode=7Bv2hOwXiWHz），会员每日1次抽奖机会，
 *       奖品为积分（888/666/100/50/5/2/1）或谢谢参与。
 *
 * 流程：initInstanceMemberAwards（取可用次数 useChance）→ useChance>0 时
 *       extractInstanceMemberAwards（执行抽奖）→ showMemberInfo（查积分余额）。
 *
 * Token：JSESSIONID，由 yayi_gettoken.js 抓取并存入 YAYI_TOKEN_1 / YAYI_TOKEN_2。
 *
 * Loon [Script]：
 * cron "10 9 * * *" script-path=yayi_signin.js, tag=亚一金店签到, enabled=true, timeout=60
 */

var TOKEN_KEY_PREFIX = "YAYI_TOKEN_";
var RESULT_KEY_PREFIX = "YAYI_LAST_RESULT_";
var BASE = "https://www.popcentury.cn/scrm-rz-minip-yi";
var SCENE_CODE = "7Bv2hOwXiWHz";

var UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.76(0x18004c3a) NetType/WIFI Language/zh_CN";
var REFERER = "https://servicewechat.com/wxee243f756ec9879d/12/page-frame.html";

// 奖品映射（来自 querySceneGameInstance 返回的 prizeList）
var PRIZE_MAP = {
  1336: "谢谢参与",
  1337: "888积分",
  1338: "666积分",
  1339: "100积分",
  1340: "50积分",
  1341: "2积分",
  1342: "5积分",
  1343: "1积分",
};

function headers(jsessionid) {
  return {
    Cookie: "JSESSIONID=" + jsessionid + "; Path=/scrm-rz-minip-yi/; HttpOnly",
    "Content-Type": "application/json",
    "x-requested-with": "application/json",
    "User-Agent": UA,
    Referer: REFERER,
    Accept: "*/*",
  };
}

function post(jsessionid, path) {
  return new Promise(function (resolve) {
    $httpClient.post(
      { url: BASE + path, headers: headers(jsessionid), body: "", timeout: 15000 },
      function (err, resp, data) {
        if (err) { resolve({ ok: false, msg: "网络错误: " + err }); return; }
        try {
          var obj = JSON.parse(data);
          resolve({ ok: true, json: obj });
        } catch (e) {
          resolve({ ok: false, msg: "响应解析失败: " + (data || "").slice(0, 120) });
        }
      }
    );
  });
}

function isExpired(json) {
  if (!json) return true;
  if (json.code !== "200") return true;
  return false;
}

function signIn(slot) {
  var jsessionid = $persistentStore.read(TOKEN_KEY_PREFIX + slot) || "";
  if (!jsessionid) {
    return Promise.resolve({ slot: slot, ok: false, expired: false, msg: "未配置 token" });
  }

  return post(jsessionid, "/minipPointsController/initInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE)
    .then(function (r) {
      if (!r.ok) return { slot: slot, ok: false, msg: r.msg };
      var j = r.json;
      if (isExpired(j)) {
        return { slot: slot, ok: false, expired: true, msg: j.message || "session 已过期" };
      }
      var useChance = (j.data && Number(j.data.useChance)) || 0;
      if (useChance <= 0) {
        return { slot: slot, ok: true, already: true, prize: null, msg: "今日已签到/抽奖" };
      }
      return post(jsessionid, "/minipPointsController/extractInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE).then(
        function (r2) {
          if (!r2.ok) return { slot: slot, ok: false, msg: r2.msg };
          var j2 = r2.json;
          if (isExpired(j2)) {
            return { slot: slot, ok: false, expired: true, msg: j2.message || "session 已过期" };
          }
          var awardId = j2.data && j2.data.awardId;
          var prize = PRIZE_MAP[awardId] || ("奖品ID:" + awardId);
          return { slot: slot, ok: true, already: false, prize: prize, msg: "抽奖获得：" + prize };
        }
      );
    })
    .then(function (res) {
      if (res.expired) return res;
      return post(jsessionid, "/memberController/showMemberInfo.do").then(function (r3) {
        if (r3.ok && !isExpired(r3.json) && r3.json.data) {
          res.points = r3.json.data.pointsBalance;
          res.mobile = r3.json.data.mobile;
          res.name = r3.json.data.memberName;
        }
        return res;
      });
    });
}

function run() {
  var slots = [];
  for (var s = 1; s <= 2; s++) {
    if ($persistentStore.read(TOKEN_KEY_PREFIX + s)) slots.push(s);
  }
  if (!slots.length) {
    $notification.post("亚一金店签到", "未配置 token", "请先打开亚一金店小程序抓取 token");
    $done();
    return;
  }

  var tasks = slots.map(signIn);
  Promise.all(tasks).then(function (results) {
    var parts = [];
    var anyExpired = false;
    results.forEach(function (r) {
      var line = "【账号" + r.slot + "】";
      if (r.ok && !r.expired) {
        line += r.already ? "今日已签到" : "✅ 签到成功，" + r.prize;
        if (r.points !== undefined) line += "，当前积分：" + r.points;
        if (r.mobile) line += "（" + r.mobile + "）";
      } else if (r.expired) {
        line += "❌ token 已失效，请重新打开小程序抓取";
        anyExpired = true;
      } else {
        line += "❌ " + (r.msg || "失败");
      }
      parts.push(line);
      $persistentStore.write(line, RESULT_KEY_PREFIX + r.slot);
    });
    $notification.post(
      "亚一金店签到" + (anyExpired ? "（有token失效）" : ""),
      parts.join("\n")
    );
    $done();
  });
}

run();
