/**
 * 华住会 - userToken 抓取（多账号）
 *
 * 设计：
 *   - 多账号通过 BoxJS 的「抓取槽位（账号）」设置选择（key: HZ_CAPTURE_SLOT，值 1/2/3），
 *     避免账号互相覆盖。
 *   - 拦截任意 *.huazhu.com 请求（排除 appgw），从 Cookie 或 User-Token 请求头提取 userToken。
 *   - 抓到新 userToken 后，用 User-Token 头调用 sign_header 验证是否为有效登录态；
 *     只有验证通过才写入持久化，避免无效 token 覆盖有效 token。
 *   - token 与已存值一致 → 静默，不弹通知。
 */

var SLOT_KEY = "HZ_CAPTURE_SLOT";
var TOKEN_PREFIX = "HZ_TOKEN_";
var RESULT_PREFIX = "HZ_LAST_RESULT_";
var VALIDATE_API = "https://appgw.huazhu.com/game/sign_header";

var UA =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 " +
  "Chrome/114 Mobile Safari/537.36";
var REFERER = "https://cdn.huazhu.com/hzapp-signinfe/";
var ORIGIN = "https://cdn.huazhu.com";

function getSlot() {
  var s = $persistentStore.read(SLOT_KEY);
  return s && /^\d+$/.test(s) ? parseInt(s, 10) : 1;
}
function getToken(slot) { return $persistentStore.read(TOKEN_PREFIX + slot) || ""; }
function setToken(slot, val) { return $persistentStore.write(val, TOKEN_PREFIX + slot); }

function mask(t) {
  if (!t) return "(空)";
  return t.length <= 10 ? t : t.substring(0, 8) + "****" + t.substring(t.length - 4);
}

function extractUserToken(headers) {
  // 优先从 Cookie 提取，其次从 User-Token / userToken 请求头提取
  var cookie = "";
  for (var k in headers) {
    if (k.toLowerCase() === "cookie") { cookie = headers[k]; break; }
  }
  if (cookie) {
    var m = /(?:^|;\s*)userToken=([^;]+)/i.exec(cookie);
    if (m) return m[1].trim();
  }
  for (var k2 in headers) {
    var lk = k2.toLowerCase();
    if (lk === "user-token" || lk === "usertoken") {
      var v = headers[k2];
      if (Object.prototype.toString.call(v) === "[object Array]") v = v[0];
      return String(v).trim();
    }
  }
  return "";
}

// 验证 userToken 是否为有效登录态（用 User-Token 请求头）
function validateToken(token, cb) {
  $httpClient.get(
    {
      url: VALIDATE_API,
      headers: {
        "User-Token": token,
        "User-Agent": UA,
        Referer: REFERER,
        Origin: ORIGIN,
        Accept: "application/json, text/plain, */*",
      },
      timeout: 10000,
    },
    function (err, resp, data) {
      if (err) { cb(false, "验证请求失败: " + err); return; }
      try {
        var j = JSON.parse(data);
        if (j.code === 200 && j.content && j.content.memberPoint != null) {
          cb(true, "积分" + j.content.memberPoint);
        } else {
          cb(false, (j && j.message) || "未登录/无效");
        }
      } catch (e) {
        cb(false, "响应解析失败");
      }
    }
  );
}

function main() {
  var headers = $request.headers || {};
  var token = extractUserToken(headers);
  console.log("[华住抓取] url=" + ($request.url || "") + " 提取到token=" + mask(token));
  if (!token) { $done({}); return; }

  var slot = getSlot();
  var old = getToken(slot);

  // 与已存 token 完全一致 → 静默
  if (old === token) {
    $done({});
    return;
  }

  // 新 token：先验证是否为有效登录态，有效才存
  validateToken(token, function (valid, info) {
    if (valid) {
      setToken(slot, token);
      console.log("[华住] 账号" + slot + " token 验证通过并已更新: " + info);
      $notification.post(
        "华住会 账号" + slot,
        "Token 已更新",
        info + "，可运行签到"
      );
    } else {
      console.log("[华住] 账号" + slot + " 抓到的 token 无效，已忽略（" + info + "）");
    }
    $done({});
  });
}

main();
