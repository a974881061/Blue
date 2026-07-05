/**
 * 徐汇日月光 - Token 自动抓取
 *
 * 功能：拦截 asem.cjtzn.com/api/ 请求，提取 token header 并持久化。
 *       Token 相同时静默跳过，不同时更新并通知。
 *
 * Loon [Script] 配置：
 * http-request ^https://asemp\.cjtzn\.com/api/ script-path=rxgyg_gettoken.js, tag=日月光Token抓取, requires-body=false, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = asem.cjtzn.com
 */

var STORE_KEY = "RXGYG_Token";

(function () {
  var headers = $request.headers || {};
  var token = null;

  // HTTP headers 大小写不固定，遍历查找 "token"
  for (var key in headers) {
    if (key.toLowerCase() === "token") {
      token = headers[key];
      break;
    }
  }

  if (!token) {
    $done({});
    return;
  }

  // 与已存储的值比较，相同则不更新不通知
  var saved = $persistentStore.read(STORE_KEY);
  if (saved === token) {
    $done({});
    return;
  }

  // 不同则更新并通知
  var ok = $persistentStore.write(token, STORE_KEY);
  if (ok) {
    $notification.post("日月光 Token", "已更新", token.substring(0, 20) + "...");
  } else {
    $notification.post("日月光 Token", "保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
