/**
 * 亚一金店 - 每日签到（诊断版）
 * 把每一步的 HTTP status 与响应原文打到通知，用于定位问题。
 */
var TOKEN_KEY_PREFIX = "YAYI_TOKEN_";
var RESULT_KEY_PREFIX = "YAYI_LAST_RESULT_";
var BASE = "https://www.popcentury.cn/scrm-rz-minip-yi";
var SCENE_CODE = "7Bv2hOwXiWHz";
var UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.76(0x18004c3a) NetType/WIFI Language/zh_CN";
var REFERER = "https://servicewechat.com/wxee243f756ec9879d/12/page-frame.html";

function headers(jsessionid) {
  return {
    Cookie: "JSESSIONID=" + jsessionid,
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
      { url: BASE + path, headers: headers(jsessionid), body: "{}", timeout: 15000 },
      function (err, resp, data) {
        if (err) { resolve({ ok: false, status: -1, body: "", msg: "网络错误: " + err }); return; }
        var st = (resp && resp.status) || 0;
        var raw = (data || "").toString();
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e) {}
        resolve({ ok: true, status: st, body: raw, json: obj });
      }
    );
  });
}
function short(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "..." : s; }

function signIn(slot) {
  var jsessionid = $persistentStore.read(TOKEN_KEY_PREFIX + slot) || "";
  var debug = ["【账号" + slot + "】"];
  if (!jsessionid) {
    debug.push("未配置 token");
    return Promise.resolve({ slot: slot, ok: false, debug: debug.join("\n") });
  }
  return post(jsessionid, "/minipPointsController/initInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE)
    .then(function (r) {
      debug.push("[init] status=" + r.status + " body=" + short(r.body, 400));
      if (!r.ok) return { slot: slot, ok: false, debug: debug.join("\n") };
      var j = r.json;
      if (!j || j.code !== "200") {
        debug.push("→ 判定为失败/过期: code=" + (j && j.code) + " msg=" + (j && j.message));
        return { slot: slot, ok: false, expired: (j && j.code === "599"), debug: debug.join("\n") };
      }
      var data = j.data || {};
      debug.push("→ data 字段: " + short(JSON.stringify(data), 300));
      // 尝试多种可能的字段名
      var useChance = Number(data.useChance != null ? data.useChance : (data.useChanceCount != null ? data.useChanceCount : data.canDrawCount));
      debug.push("→ useChance(取到)=" + useChance);
      if (useChance <= 0) {
        return { slot: slot, ok: true, already: true, debug: debug.join("\n") };
      }
      return post(jsessionid, "/minipPointsController/extractInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE).then(function (r2) {
        debug.push("[extract] status=" + r2.status + " body=" + short(r2.body, 400));
        if (!r2.ok) return { slot: slot, ok: false, debug: debug.join("\n") };
        var j2 = r2.json;
        if (!j2 || j2.code !== "200") {
          debug.push("→ 抽奖失败: code=" + (j2 && j2.code) + " msg=" + (j2 && j2.message));
          return { slot: slot, ok: false, debug: debug.join("\n") };
        }
        var d2 = j2.data || {};
        debug.push("→ extract data: " + short(JSON.stringify(d2), 200));
        return { slot: slot, ok: true, already: false, awardId: d2.awardId, debug: debug.join("\n") };
      });
    })
    .then(function (res) {
      return post(jsessionid, "/memberController/showMemberInfo.do").then(function (r3) {
        debug.push("[info] status=" + r3.status + " body=" + short(r3.body, 200));
        if (r3.ok && r3.json && r3.json.code === "200" && r3.json.data) {
          res.points = r3.json.data.pointsBalance;
        }
        res.debug = debug.join("\n");
        return res;
      }).catch(function () { res.debug = debug.join("\n"); return res; });
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
  Promise.all(slots.map(signIn)).then(function (results) {
    var all = [];
    results.forEach(function (r) {
      all.push(r.debug);
      $persistentStore.write(r.debug, RESULT_KEY_PREFIX + r.slot);
    });
    $notification.post("亚一金店签到（诊断）", all.join("\n\n"));
    $done();
  }).catch(function (e) {
    $notification.post("亚一金店签到（诊断异常）", String(e));
    $done();
  });
}
run();
