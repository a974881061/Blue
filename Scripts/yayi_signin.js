/**
 * 亚一金店 - 每日签到抽奖（正式版）
 *
 * 依据 HAR 抓包实证：
 *   init    POST .../minipPointsController/initInstanceMemberAwards?sceneGameInstanceCode=7Bv2hOwXiWHz
 *           headers: x-requested-with: application/json, content-type: application/json, Cookie, UA, Referer; body 空
 *           resp: {"code":"200","data":{"useChance":1,"chance":0}} → useChance>0 才可抽奖
 *   extract POST .../minipPointsController/extractInstanceMemberAwards?sceneGameInstanceCode=7Bv2hOwXiWHz
 *           headers: x-requested-with: application/json, content-type: application/x-www-form-urlencoded;charset=utf-8, Cookie, UA, Referer; body 空
 *           resp: {"code":"200","data":{"awardId":1341,"prizeTypeId":4}}
 *   查询   POST .../memberController/showMemberInfo.do
 *   code 599 = 会话失效（需重新抓 token）
 *
 * 说明：抽奖前 init.useChance=1，抽奖后 init.useChance=0、chance=1 → 每天 1 次。
 */

var TOKEN_KEY_PREFIX = "YAYI_TOKEN_";
var RESULT_KEY_PREFIX = "YAYI_LAST_RESULT_";
var BASE = "https://www.popcentury.cn/scrm-rz-minip-yi";
var SCENE_CODE = "7Bv2hOwXiWHz";

var UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.76(0x18004c3a) NetType/WIFI Language/zh_CN";
var REFERER = "https://servicewechat.com/wxee243f756ec9879d/12/page-frame.html";

// 奖项映射（awardId → 奖品）
var PRIZE = {
  "1336": "谢谢参与",
  "1337": "888积分",
  "1338": "666积分",
  "1339": "100积分",
  "1340": "50积分",
  "1341": "2积分",
  "1342": "5积分",
  "1343": "1积分",
};

function baseHeaders(jsessionid) {
  // X-Yayi-Internal：让抓取脚本跳过本脚本自身发出的请求，避免误抓/误写槽位
  return {
    "X-Yayi-Internal": "1",
    Cookie: "JSESSIONID=" + jsessionid,
    "User-Agent": UA,
    Referer: REFERER,
    Accept: "*/*",
  };
}
function jsonHeaders(jsessionid) {
  var h = baseHeaders(jsessionid);
  h["x-requested-with"] = "application/json";
  h["content-type"] = "application/json";
  return h;
}
function formHeaders(jsessionid) {
  var h = baseHeaders(jsessionid);
  h["x-requested-with"] = "application/json";
  h["content-type"] = "application/x-www-form-urlencoded;charset=utf-8";
  return h;
}

function post(jsessionid, path, headers) {
  return new Promise(function (resolve) {
    $httpClient.post(
      { url: BASE + path, headers: headers, body: "" },
      function (err, resp, data) {
        if (err) { resolve({ ok: false, status: -1, body: "", msg: String(err) }); return; }
        var raw = (data || "").toString();
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e) {}
        resolve({ ok: true, status: (resp && resp.status) || 0, body: raw, json: obj });
      }
    );
  });
}

// 取积分做摘要
function withInfo(jsessionid, out) {
  return post(jsessionid, "/memberController/showMemberInfo.do", jsonHeaders(jsessionid))
    .then(function (r) {
      if (r.ok && r.json && r.json.code === "200" && r.json.data) {
        if (r.json.data.pointsBalance != null) out.points = r.json.data.pointsBalance;
      }
      return out;
    })
    .catch(function () { return out; });
}

function signIn(slot) {
  var jsessionid = $persistentStore.read(TOKEN_KEY_PREFIX + slot) || "";
  var out = { slot: slot, ok: false, summary: "" };
  if (!jsessionid) { out.summary = "未配置 token"; return Promise.resolve(out); }

  return post(jsessionid, "/minipPointsController/initInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE, jsonHeaders(jsessionid))
    .then(function (r) {
      if (!r.ok) { out.summary = "网络错误: " + r.msg; return out; }
      if (r.status !== 200) { out.summary = "init HTTP " + r.status; return out; }
      var j = r.json;
      if (!j || j.code !== "200") {
        out.expired = (j && j.code === "599");
        out.summary = "会话失效(code=" + (j && j.code) + "): " + ((j && j.message) || "") + (out.expired ? "，请重新抓取 token" : "");
        return out;
      }

      var useChance = Number((j.data || {}).useChance);
      if (!(useChance > 0)) {
        out.ok = true;
        out.drawn = false;
        out.summary = "今日已抽过（剩余次数 " + (isNaN(useChance) ? "?" : useChance) + "）";
        return withInfo(jsessionid, out);
      }

      // 有次数 → 抽奖
      return post(jsessionid, "/minipPointsController/extractInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE, formHeaders(jsessionid))
        .then(function (r2) {
          if (!r2.ok) { out.summary = "抽奖网络错误: " + r2.msg; return out; }
          var j2 = r2.json;
          if (!j2 || j2.code !== "200") {
            out.summary = "抽奖失败(code=" + (j2 && j2.code) + "): " + ((j2 && j2.message) || "");
            return out;
          }
          var aid = String((j2.data || {}).awardId);
          out.ok = true;
          out.drawn = true;
          out.summary = "抽奖成功：" + (PRIZE[aid] || ("奖项" + aid));
          return withInfo(jsessionid, out);
        });
    })
    .catch(function (e) { out.summary = "异常: " + e; return out; });
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

  var lines = [];
  var idx = 0;
  function next() {
    if (idx >= slots.length) {
      $notification.post("亚一金店签到", "完成", lines.join("\n"));
      $done();
      return;
    }
    var slot = slots[idx++];
    signIn(slot).then(function (r) {
      var line = "账号" + r.slot + " " + r.summary;
      if (r.points != null) line += "，积分" + r.points;
      lines.push(line);
      $persistentStore.write(line, RESULT_KEY_PREFIX + r.slot);
      setTimeout(next, 1500);
    });
  }
  next();
}

run();
