/**
 * 亚一金店 - 每日签到抽奖（v4）
 *
 * 依据 HAR 抓包实证：
 *   init    POST .../minipPointsController/initInstanceMemberAwards?sceneGameInstanceCode=7Bv2hOwXiWHz
 *   extract POST .../minipPointsController/extractInstanceMemberAwards?sceneGameInstanceCode=7Bv2hOwXiWHz
 *   查询   POST .../memberController/showMemberInfo.do
 *   code 599 = 会话失效（需重新抓 token）
 *
 * v4 关键变更：
 *   实测发现 init 返回 useChance=0 / chance=1 时，用户并未抽过奖，
 *   说明这两个字段的语义与最初假设相反（或不稳定），不能用来"跳过抽奖"。
 *   因此改为【无条件尝试抽奖】：最终是否成功由 extract 的返回码决定，
 *   服务端在无次数时会明确拒绝，不会造成副作用。init 仅用于记录状态、便于排查。
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
  // X-Yayi-Internal：让抓取脚本跳过本脚本自身发出的请求，避免多账号时误抓误写槽位
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

function post(jsessionid, path, headers, retry) {
  return new Promise(function (resolve) {
    $httpClient.post(
      { url: BASE + path, headers: headers, body: "" },
      function (err, resp, data) {
        if (err) {
          if (retry > 0) {
            setTimeout(function () {
              post(jsessionid, path, headers, retry - 1).then(resolve);
            }, 2000);
            return;
          }
          resolve({ ok: false, status: -1, body: "", msg: String(err) });
          return;
        }
        var raw = (data || "").toString();
        var obj = null;
        try { obj = JSON.parse(raw); } catch (e) {}
        resolve({ ok: true, status: (resp && resp.status) || 0, body: raw, json: obj });
      }
    );
  });
}

function withInfo(jsessionid, out) {
  return post(jsessionid, "/memberController/showMemberInfo.do", jsonHeaders(jsessionid), 0)
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

  // 1) init：仅取状态做记录，不用于决定是否抽奖
  return post(jsessionid, "/minipPointsController/initInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE, jsonHeaders(jsessionid), 1)
    .then(function (r) {
      if (!r.ok) { out.summary = "init 网络错误: " + r.msg; return out; }
      var j = r.json;
      if (j && j.code === "599") {
        out.summary = "会话已失效(code=599)，请打开小程序重新抓取 token";
        return out;
      }
      if (j && j.code === "200") {
        var d = j.data || {};
        out.initInfo = "init{useChance=" + d.useChance + ",chance=" + d.chance + "}";
      } else {
        out.initInfo = "init{code=" + (j ? j.code : "?") + "}";
      }

      // 2) extract：无条件尝试抽奖，以返回码为准
      return post(jsessionid, "/minipPointsController/extractInstanceMemberAwards?sceneGameInstanceCode=" + SCENE_CODE, formHeaders(jsessionid), 1)
        .then(function (r2) {
          if (!r2.ok) { out.summary = "抽奖网络错误: " + r2.msg; return out; }
          if (r2.status !== 200) { out.summary = "抽奖 HTTP " + r2.status; return out; }
          var j2 = r2.json;
          if (!j2) { out.summary = "抽奖响应解析失败: " + String(r2.body).substring(0, 120); return out; }

          if (j2.code === "200" && j2.data) {
            var aid = String(j2.data.awardId);
            out.ok = true;
            out.drawn = true;
            out.summary = "抽奖成功：" + (PRIZE[aid] || ("奖项" + aid));
            return withInfo(jsessionid, out);
          }
          // 非 200：明确记录服务端原始反馈
          out.summary = "抽奖未成功(code=" + j2.code + "): " + (j2.message || "无返回信息");
          return out;
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
      if (r.initInfo) line += "\n  " + r.initInfo;
      if (r.points != null) line += "，积分" + r.points;
      lines.push(line);
      $persistentStore.write(line.replace(/\n/g, " "), RESULT_KEY_PREFIX + r.slot);
      setTimeout(next, 1500);
    });
  }
  next();
}

run();
