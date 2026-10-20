/**
 * 亚一金店 - Token(JSESSIONID) 抓取（多账号）
 *
 * 设计：
 *   - 多账号通过 BoxJS 的「抓取槽位（账号）」设置选择（key: YAYI_CAPTURE_SLOT，值 1/2），
 *     避免账号2的 token 覆盖账号1。
 *   - 拦截 popcentury.cn 的任意 scrm-rz-minip-yi 请求，从 Cookie 提取 JSESSIONID。
 *   - 【关键】抓到新 JSESSIONID 后，先调用 showMemberInfo.do 验证是否为已登录会话；
 *     只有验证通过（code=200 且有会员信息）才写入持久化，避免过期/访客 session 覆盖有效 token。
 *   - token 与已存值一致 → 静默，不弹通知。
 *   - 防递归：验证请求带内部标记头 X-Yayi-Internal，脚本检测到该头直接放行。
 */

var SLOT_KEY = "YAYI_CAPTURE_SLOT";
var TOKEN_KEY_PREFIX = "YAYI_TOKEN_";
var RESULT_KEY_PREFIX = "YAYI_LAST_RESULT_";
var VALIDATE_API = "https://www.popcentury.cn/scrm-rz-minip-yi/memberController/showMemberInfo.do";

var UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.76(0x18004c3a) NetType/WIFI Language/zh_CN";
var REFERER = "https://servicewechat.com/wxee243f756ec9879d/12/page-frame.html";

function getSlot() {
  var s = $persistentStore.read(SLOT_KEY);
  return s === "2" ? 2 : 1;
}
function getToken(slot) { return $persistentStore.read(TOKEN_KEY_PREFIX + slot) || ""; }
function setToken(slot, val) { return $persistentStore.write(val, TOKEN_KEY_PREFIX + slot); }

function mask(t) {
  if (!t) return "(空)";
  return t.length <= 8 ? t : t.substring(0, 6) + "****" + t.substring(t.length - 4);
}

function getHeader(headers, name) {
  var target = name.toLowerCase();
  for (var k in headers) {
    if (k.toLowerCase() === target) return headers[k];
  }
  return "";
}

function extractJsessid(cookieHeader) {
  if (!cookieHeader) return "";
  var m = /(?:^|;\s*)JSESSIONID=([^;]+)/i.exec(cookieHeader);
  return m ? m[1].trim() : "";
}

// 验证 JSESSIONID 是否为已登录的有效会话
// 注意：带 X-Yayi-Internal 内部标记头，避免被本脚本自身的抓取规则再次拦截导致递归
function validateToken(jsessionid, cb) {
  $httpClient.post(
    {
      url: VALIDATE_API,
      headers: {
        "X-Yayi-Internal": "1",
        Cookie: "JSESSIONID=" + jsessionid,
        "Content-Type": "application/json",
        "x-requested-with": "application/json",
        "User-Agent": UA,
        Referer: REFERER,
        Accept: "*/*",
      },
      body: "",
      timeout: 10000,
    },
    function (err, resp, data) {
      if (err) { cb(false, "验证请求失败: " + err); return; }
      try {
        var j = JSON.parse(data);
        if (j.code === "200" && j.data && j.data.memberId) {
          cb(true, j.data.mobile || j.data.memberName || "已登录");
        } else {
          cb(false, (j && j.message) || "未登录/会话失效");
        }
      } catch (e) {
        cb(false, "响应解析失败");
      }
    }
  );
}

function main() {
  var headers = $request.headers || {};

  // 【防递归】本脚本自身发出的验证请求带内部标记头，直接放行，不再二次处理
  if (getHeader(headers, "X-Yayi-Internal")) {
    $done({});
    return;
  }

  var cookie = getHeader(headers, "cookie");
  var token = extractJsessid(cookie);
  console.log("[亚一抓取] url=" + ($request.url || "") + " 有Cookie=" + (cookie ? "是" : "否") + " 提取到token=" + mask(token));
  if (!token) { $done({}); return; }

  var slot = getSlot();
  var old = getToken(slot);

  // 与已存 token 完全一致 → 静默（包括已验证过的有效 token）
  if (old === token) {
    $done({});
    return;
  }

  // 新 token：先验证是否为已登录会话，有效才存
  validateToken(token, function (valid, info) {
    if (valid) {
      setToken(slot, token);
      console.log("[亚一] 账号" + slot + " token 验证通过并已更新: " + info);
      $notification.post(
        "亚一金店 账号" + slot,
        "Token 已更新",
        "会员: " + info + "，可运行签到"
      );
    } else {
      console.log("[亚一] 账号" + slot + " 抓到的 token 无效，已忽略（" + info + "）");
    }
    $done({});
  });
}

main();
