/**
 * i百联 - Token 自动抓取
 *
 * 功能：拦截 mh5.bl.com/h5_gateway/ 请求，提取 membertoken + devicekey + sm-deviceid
 *       组合为 JSON 凭证持久化到账号1。凭证相同时静默跳过，不同时更新并通知。
 *       （Token 为非 JWT 的 64 位 hex，无法检测过期；失效后重新打开 App 积分页即可刷新）
 *
 * Loon [Script] 配置：
 * http-request ^https?:\/\/mh5\.bl\.com\/h5_gateway\/ script-path=ibailian_gettoken.js, tag=i百联Token抓取, requires-body=false, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = mh5.bl.com
 */

var STORE_KEY = "IBL_Creds_1";

(function () {
  var headers = $request.headers || {};

  // HTTP headers 大小写不固定，遍历查找
  function getHeader(name) {
    var lower = name.toLowerCase();
    for (var key in headers) {
      if (key.toLowerCase() === lower) return headers[key];
    }
    return null;
  }

  var token = getHeader("membertoken");
  if (!token) {
    $done({});
    return;
  }

  var creds = {
    membertoken: token,
    devicekey: getHeader("devicekey") || "",
    smDeviceid: getHeader("sm-deviceid") || ""
  };
  var newStr = JSON.stringify(creds);

  // 相同则不更新不通知
  var saved = $persistentStore.read(STORE_KEY);
  if (saved === newStr) {
    $done({});
    return;
  }

  // 不同则更新并通知
  var ok = $persistentStore.write(newStr, STORE_KEY);
  if (ok) {
    $notification.post("i百联 Token", "账号1 已更新", token.substring(0, 20) + "...");
  } else {
    $notification.post("i百联 Token", "账号1 保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
