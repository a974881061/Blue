/**
 * 茉莉奶白 - Token 自动抓取
 *
 * 功能：拦截 webapi.qmai.cn 请求，提取 Qm-User-Token 并持久化到账号1。
 *       Token 相同时静默跳过，不同时更新并通知。
 *
 * Loon [Script] 配置：
 * http-request ^https://webapi\.qmai\.cn/web/ script-path=mlnb_gettoken.js, tag=茉莉奶白Token抓取, requires-body=false, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = webapi.qmai.cn
 */

var STORE_KEY = "MLNB_Token_1";

(function () {
  var headers = $request.headers || {};
  var token = null;

  // HTTP headers 大小写不固定，遍历查找
  for (var key in headers) {
    if (key.toLowerCase() === "qm-user-token") {
      token = headers[key];
      break;
    }
  }

  if (!token) {
    $done({});
    return;
  }

  // 相同则不更新不通知
  var saved = $persistentStore.read(STORE_KEY);
  if (saved === token) {
    $done({});
    return;
  }

  // 不同则更新并通知
  var ok = $persistentStore.write(token, STORE_KEY);
  if (ok) {
    $notification.post("茉莉奶白 Token", "账号1 已更新", token.substring(0, 20) + "...");
  } else {
    $notification.post("茉莉奶白 Token", "账号1 保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
