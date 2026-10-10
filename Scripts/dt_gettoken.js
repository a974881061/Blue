/**
 * DT生活小程序 - Token 自动抓取（轻量无感化版）
 *
 * 设计原则：
 *   1. 只拦截 getUserInfo 一个接口（小程序启动必调、自带 Authorization 头、请求体极小）
 *   2. requires-body=false，不读取/缓冲请求体，毫秒级放行，不影响小程序任何功能
 *   3. 只从请求头 Authorization: Bearer 提取 token
 *   4. 双重静默：token 与已存值相同 -> 不弹；即使变化，30 分钟内也最多弹一次（防并发竞态重复通知）
 *
 * Loon [Script] 配置：
 * http-request ^https:\/\/ebeikeapi\.ebeck\.cn\/api\/v2\/user\/getUserInfo$ script-path=dt_gettoken.js, tag=DT生活Token抓取, requires-body=false, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = ebeikeapi.ebeck.cn
 */

var TOKEN_KEY = "DT_LIFE_TOKEN";
var NOTIFY_TIME_KEY = "DT_LIFE_LastNotify";
var NOTIFY_INTERVAL_MS = 30 * 60 * 1000; // 30 分钟通知节流

function main() {
  var url = $request.url || "";
  var headers = $request.headers || {};

  console.log("[DT生活] 拦截 getUserInfo: " + url.substring(0, 80));

  // 从 Authorization: Bearer 头提取 token
  var token = "";
  for (var hk in headers) {
    if (hk.toLowerCase() === "authorization") {
      var hv = headers[hk] || "";
      token = hv.indexOf("Bearer ") === 0 ? hv.substring(7) : hv;
      break;
    }
  }

  if (!token) {
    // 该请求未携带 Authorization，正常放行
    $done({});
    return;
  }

  token = token.trim();

  // ===== 第一重静默：token 完全相同，直接放行不处理 =====
  var oldToken = $persistentStore.read(TOKEN_KEY);
  if (oldToken === token) {
    console.log("[DT生活] token 未变化，静默放行");
    $done({});
    return;
  }

  // token 有变化：写入新值（供签到使用）
  var writeOk = $persistentStore.write(token, TOKEN_KEY);
  console.log("[DT生活] 检测到新 token，写入结果: " + writeOk);

  // ===== 第二重静默：30 分钟内已通知过，则只更新数据不再弹 =====
  var now = Date.now();
  var lastNotify = 0;
  var lastNotifyRaw = $persistentStore.read(NOTIFY_TIME_KEY);
  if (lastNotifyRaw) {
    lastNotify = Number(lastNotifyRaw) || 0;
  }

  if (now - lastNotify < NOTIFY_INTERVAL_MS) {
    console.log("[DT生活] token 已更新，但处于通知节流期，静默不弹");
    $done({});
    return;
  }

  // 记录本次通知时间并发送通知
  $persistentStore.write(String(now), NOTIFY_TIME_KEY);
  $notification.post(
    "DT生活签到",
    "Token 已更新",
    "新 Token: " + token.substring(0, 12) + "...，将自动每日签到"
  );

  console.log("[DT生活] token 更新通知已发送");
  $done({});
}

main();
