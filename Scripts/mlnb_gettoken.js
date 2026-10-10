/**
 * 茉莉奶白 - Token 自动抓取
 *
 * 功能：拦截 webapi.qmai.cn 请求，提取 Qm-User-Token 并持久化到账号1。
 *       Token 相同时静默跳过，不同时更新并通知。
 *       通过 appid 过滤，避免误抓同后端的林里等小程序的 Token。
 *
 * Loon [Script] 配置：
 * http-request ^https://webapi\.qmai\.cn/web/ script-path=mlnb_gettoken.js, tag=茉莉奶白Token抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = webapi.qmai.cn
 */
var STORE_KEY = "MLNB_Token_1";
var MLNB_APPID = "wx17102e91e70c9b9b"; // 茉莉奶白小程序 appid，用于区分同后端的其他小程序（如林里）
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
  // 通过 appid 过滤：只保留茉莉奶白自身的请求，
  // 避免把林里（wx26c7aaacfa017719）等同后端小程序的 Token 误存进来。
  var appid = null;
  // 1) 从请求体 JSON 中取 appid
  var body = $request.body || "";
  if (body) {
    try {
      var parsed = JSON.parse(body);
      if (parsed && parsed.appid) appid = String(parsed.appid);
    } catch (e) {}
  }
  // 2) 若 body 中没有，尝试从 URL query 取 appid
  if (!appid && $request.url) {
    var qIndex = $request.url.indexOf("?");
    if (qIndex >= 0) {
      var query = $request.url.substring(qIndex + 1);
      var pairs = query.split("&");
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split("=");
        if (kv[0] === "appid" && kv[1]) {
          appid = decodeURIComponent(kv[1]);
          break;
        }
      }
    }
  }
  // 若能识别出 appid 且不是茉莉奶白，则跳过（林里等其他小程序的请求）
  if (appid && appid !== MLNB_APPID) {
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