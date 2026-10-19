/**
 * 亚一金店 - Token(JSESSIONID) 抓取 + 账号槽位选择（多账号）
 *
 * 设计：
 *   - 多账号用「槽位选择器」：打开小程序前先访问 http://yayi.local/select1 或 /select2
 *     选择要写入的账号槽，避免账号2的 token 覆盖账号1。
 *   - 拦截 popcentury.cn 的任意 scrm-rz-minip-yi 请求，从 Cookie 提取 JSESSIONID，
 *     写入当前选中槽位的 YAYI_TOKEN_N。
 *   - token 与已存值一致 → 静默，不弹通知。
 *   - 访问 http://yayi.local/status 查看当前槽位、各账号 token 状态与最近签到结果。
 *
 * Loon [Script] 配置（见 yayi_signin.plugin）：
 *   http-request ^https?://www\.popcentury\.cn/scrm-rz-minip-yi/ script-path=yayi_gettoken.js, requires-body=false
 *   http-request ^https?://yayi\.local/(select1|select2|status) script-path=yayi_gettoken.js
 */

var SLOT_KEY = "YAYI_CAPTURE_SLOT";
var TOKEN_KEY_PREFIX = "YAYI_TOKEN_";
var RESULT_KEY_PREFIX = "YAYI_LAST_RESULT_";

function getSlot() {
  var s = $persistentStore.read(SLOT_KEY);
  return s === "2" ? 2 : 1;
}

function getToken(slot) {
  return $persistentStore.read(TOKEN_KEY_PREFIX + slot) || "";
}

function setToken(slot, val) {
  return $persistentStore.write(val, TOKEN_KEY_PREFIX + slot);
}

function mask(t) {
  if (!t) return "(空)";
  return t.length <= 8 ? t : t.substring(0, 6) + "****" + t.substring(t.length - 4);
}

function extractJsessid(cookieHeader) {
  if (!cookieHeader) return "";
  var m = /(?:^|;\s*)JSESSIONID=([^;]+)/i.exec(cookieHeader);
  return m ? m[1].trim() : "";
}

function handlePseudoUrl(url) {
  if (url.indexOf("/select1") >= 0) {
    $persistentStore.write("1", SLOT_KEY);
    return html("已切换到 账号1", "接下来打开亚一金店小程序，token 将写入 YAYI_TOKEN_1。");
  }
  if (url.indexOf("/select2") >= 0) {
    $persistentStore.write("2", SLOT_KEY);
    return html("已切换到 账号2", "接下来打开亚一金店小程序，token 将写入 YAYI_TOKEN_2。");
  }
  if (url.indexOf("/status") >= 0) {
    var slot = getSlot();
    var t1 = getToken(1), t2 = getToken(2);
    var r1 = $persistentStore.read(RESULT_KEY_PREFIX + 1) || "暂无";
    var r2 = $persistentStore.read(RESULT_KEY_PREFIX + 2) || "暂无";
    return html("亚一金店 状态",
      "<b>当前抓取槽位：账号" + slot + "</b><br>" +
      "账号1 token：" + mask(t1) + "<br>" +
      "账号1 最近签到：" + r1 + "<br><br>" +
      "账号2 token：" + mask(t2) + "<br>" +
      "账号2 最近签到：" + r2
    );
  }
  return html("未知操作", "支持 /select1 /select2 /status");
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

  // 伪 URL：槽位选择 / 状态查看
  if (/yayi\.local\//i.test(url)) {
    $done(handlePseudoUrl(url));
    return;
  }

  // 业务请求：抓取 JSESSIONID
  var headers = $request.headers || {};
  var cookie = "";
  for (var k in headers) {
    if (k.toLowerCase() === "cookie") { cookie = headers[k]; break; }
  }
  var token = extractJsessid(cookie);
  if (!token) {
    $done({});
    return;
  }

  var slot = getSlot();
  var old = getToken(slot);
  if (old === token) {
    // token 未变化，静默不通知
    console.log("[亚一] 账号" + slot + " token 未变化，静默放行");
    $done({});
    return;
  }

  var ok = setToken(slot, token);
  console.log("[亚一] 账号" + slot + " token 已更新（写入" + (ok ? "成功" : "失败") + "）");
  if (ok) {
    $notification.post(
      "亚一金店 账号" + slot,
      "Token 已更新",
      "新 JSESSIONID：" + mask(token) + "，可运行签到"
    );
  } else {
    $notification.post("亚一金店 账号" + slot, "Token 保存失败", "写入 persistentStore 失败");
  }
  $done({});
}

main();
