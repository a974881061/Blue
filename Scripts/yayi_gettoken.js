/**
 * 亚一金店 - Token(JSESSIONID) 抓取 + 账号槽位选择（多账号）
 *
 * 设计：
 *   - 多账号用「槽位选择器」：打开小程序前先访问 http://yayi.local/select1 或 /select2
 *     选择要写入的账号槽，避免账号2的 token 覆盖账号1。
 *   - 拦截 popcentury.cn 的任意 scrm-rz-minip-yi 请求，从 Cookie 提取 JSESSIONID。
 *   - 【关键】抓到新 JSESSIONID 后，先调用 showMemberInfo.do 验证是否为已登录会话；
 *     只有验证通过（code=200 且有会员信息）才写入持久化，避免过期/访客 session 覆盖有效 token。
 *   - token 与已存值一致 → 静默，不弹通知。
 *   - 访问 http://yayi.local/status 查看当前槽位、各账号 token 状态与最近签到结果。
 *
 * v2 修复（自拦截递归）：
 *   验证请求本身命中同一条抓取规则，会再次触发本脚本、再次验证，形成无限递归，
 *   导致 token 永远无法写入（表现为"抓不到 cookie"）。现给验证请求加内部标记头
 *   `X-Yayi-Internal: 1`，脚本检测到该头直接 $done({}) 放行，杜绝递归。
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
      "账号1 token：" + mask(t1) + "<br>账号1 最近签到：" + r1 + "<br><br>" +
      "账号2 token：" + mask(t2) + "<br>账号2 最近签到：" + r2
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

  if (/yayi\.local\//i.test(url)) {
    $done(handlePseudoUrl(url));
    return;
  }

  var headers = $request.headers || {};

  // 【防递归】本脚本自身发出的验证请求带内部标记头，直接放行，不再二次处理
  if (getHeader(headers, "X-Yayi-Internal")) {
    $done({});
    return;
  }

  var cookie = getHeader(headers, "cookie");
  var token = extractJsessid(cookie);
  console.log("[亚一抓取] url=" + url + " 有Cookie=" + (cookie ? "是" : "否") + " 提取到token=" + mask(token));
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
