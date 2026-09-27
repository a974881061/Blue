/**
 * 平安银行 - 金橙福利社 Token 自动抓取
 *
 * 功能：拦截任务列表查询请求，提取 Cookie 中的认证信息（brcpSessionTicket 等），
 *       持久化到本地存储。Cookie 相同时静默跳过。
 *
 * Loon [Script] 配置：
 * http-request ^https:\/\/rsb\.pingan\.com\.cn\/idata\/cust\/cmss_biz\/cmss\/task\/channel\/queryChannelTasksV4 script-path=pingan_jincheng_gettoken.js, tag=平安金橙Token抓取, requires-body=false, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = rsb.pingan.com.cn, rsb2.pingan.com.cn
 */

var STORE_KEY = "PINGAN_JINCHENG_COOKIE";

(function () {
  var headers = $request.headers || {};
  var cookie = "";

  // 从请求头获取 Cookie
  for (var key in headers) {
    if (key.toLowerCase() === "cookie") {
      cookie = headers[key];
      break;
    }
  }

  if (!cookie) {
    $done({});
    return;
  }

  // 提取关键 Cookie 字段
  var brcpSessionTicket = "";
  var cookies = cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var c = cookies[i].trim();
    if (c.indexOf("brcpSessionTicket=") === 0) {
      brcpSessionTicket = c.substring("brcpSessionTicket=".length);
      break;
    }
  }

  if (!brcpSessionTicket) {
    $done({});
    return;
  }

  // 相同则不更新不通知
  var saved = $persistentStore.read(STORE_KEY);
  if (saved === cookie) {
    $done({});
    return;
  }

  // 保存完整 Cookie
  var ok = $persistentStore.write(cookie, STORE_KEY);
  if (ok) {
    $notification.post(
      "平安金橙福利社",
      "Cookie 已更新",
      "brcpSessionTicket: " + brcpSessionTicket.substring(0, 15) + "..."
    );
  } else {
    $notification.post("平安金橙福利社", "Cookie 保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
