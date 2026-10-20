/**
 * 华住会签到 - userToken 抓取 + 账号槽位选择（多账号）
 *
 * 设计：
 *   - 多账号用「槽位选择器」：打开华住会前先访问 http://huazhu.local/select1 或 /select2（支持 select1~select10）
 *     选择要写入的账号槽，避免账号互相覆盖。
 *   - 拦截任意 *.huazhu.com 请求，从 Cookie 提取 userToken。
 *   - 抓到新 userToken 后，调用 sign_header 验证是否为有效登录态；
 *     只有验证通过（code=200 且有积分信息）才写入持久化，避免无效 token 覆盖有效 token。
 *   - token 与已存值一致 → 静默，不弹通知。
 *   - 访问 http://huazhu.local/status 查看当前槽位、各账号 token 状态与最近签到结果。
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

function extractUserToken(cookieHeader) {
  if (!cookieHeader) return "";
  var m = /(?:^|;\s*)userToken=([^;]+)/i.exec(cookieHeader);
  return m ? m[1].trim() : "";
}

// 验证 userToken 是否为有效登录态
function validateToken(token, cb) {
  $httpClient.get(
    {
      url: VALIDATE_API,
      headers: {
        Cookie: "userToken=" + token,
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

function handlePseudoUrl(url) {
  var sm = /\/select(\d+)/.exec(url);
  if (sm) {
    var n = parseInt(sm[1], 10);
    $persistentStore.write(String(n), SLOT_KEY);
    return html("已切换到 账号" + n, "接下来打开华住会 App/小程序，userToken 将写入 HZ_TOKEN_" + n + "。");
  }
  if (url.indexOf("/status") >= 0) {
    var slot = getSlot();
    var lines = ["<b>当前抓取槽位：账号" + slot + "</b>"];
    for (var i = 1; i <= 10; i++) {
      var t = getToken(i);
      if (!t && i > 2) continue;
      var r = $persistentStore.read(RESULT_PREFIX + i) || "暂无";
      lines.push("账号" + i + " token：" + mask(t) + "<br>账号" + i + " 最近签到：" + r + "<br>");
    }
    return html("华住会 状态", lines.join("<br>"));
  }
  return html("未知操作", "支持 /select1 ~ /select10、/status");
}

function html(title, body) {
  return {
    response: {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body:
        '<!doctype html><html><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        "<title>" + title + "</title>" +
        "<style>body{font-family:-apple-system,sans-serif;padding:24px;background:#f5f6f8;color:#222}" +
        ".card{background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(0,0,0,.06);line-height:1.8}</style>" +
        "</head><body><div class=card><h2 style='margin:0 0 12px'>" + title + "</h2>" + body +
        "</div></body></html>",
    },
  };
}

function main() {
  var url = $request.url || "";

  if (/huazhu\.local\//i.test(url)) {
    $done(handlePseudoUrl(url));
    return;
  }

  var headers = $request.headers || {};
  var cookie = "";
  for (var k in headers) {
    if (k.toLowerCase() === "cookie") { cookie = headers[k]; break; }
  }
  var token = extractUserToken(cookie);
  if (!token) { $done({}); return; }

  var slot = getSlot();
  var old = getToken(slot);

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
