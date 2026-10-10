/**
 * DT生活小程序 - Token 自动抓取
 *
 * 拦截 ebeikeapi.ebeck.cn 的任意 API 请求，从请求体 JSON 中提取 token，
 * 持久化到本地存储。Token 相同时静默跳过，不同时更新并通知。
 *
 * Loon [Script] 配置：
 * http-request ^https:\/\/ebeikeapi\.ebeck\.cn\/api\/ script-path=dt_gettoken.js, tag=DT生活Token抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = ebeikeapi.ebeck.cn
 */

var TOKEN_KEY = "DT_LIFE_TOKEN";

var body = $request.body || "";
var url = $request.url || "";
var headers = $request.headers || {};

console.log("[DT生活] 拦截请求: " + url.substring(0, 80));

// 解析请求体 JSON
var data = {};
if (body) {
  if (typeof body === "string") {
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.log("[DT生活] JSON 解析失败: " + e.message);
      data = {};
    }
  } else if (typeof body === "object") {
    data = body;
  }
}

// 优先从请求体取 token，没有则从 Authorization: Bearer 头取
var token = data.token || "";
if (!token) {
  for (var hk in headers) {
    if (hk.toLowerCase() === "authorization") {
      var hv = headers[hk] || "";
      if (hv.indexOf("Bearer ") === 0) {
        token = hv.substring(7);
      } else {
        token = hv;
      }
      break;
    }
  }
}

if (!token) {
  // 该接口未携带 token（如 getUserInfo），正常跳过
  $done({});
}

console.log("[DT生活] 提取到 token: " + token.substring(0, 12) + "...");

// 相同则不更新不通知
var oldToken = $persistentStore.read(TOKEN_KEY);
if (oldToken === token) {
  console.log("[DT生活] token 未变化，跳过");
  $done({});
}

var ok = $persistentStore.write(token, TOKEN_KEY);
if (ok) {
  console.log("[DT生活] token 保存成功");
  $notification.post(
    "DT生活签到",
    "Token 抓取成功",
    "Token: " + token.substring(0, 12) + "...，将自动每日签到"
  );
} else {
  console.log("[DT生活] token 保存失败");
  $notification.post("DT生活签到", "Token 保存失败", "写入 persistentStore 失败");
}

$done({});
