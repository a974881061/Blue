/**
 * 鑫耀光环 Token 自动抓取
 * 拦截 /api/paypoint/GetIsBonusStatus 请求获取会员 Token
 * （该接口每次打开小程序都会调用，且携带会员 Token）
 *
 * [Script] 配置：
 * http-request ^https://crm\.theringlive\.com:13881/api/paypoint/GetIsBonusStatus script-path=鑫耀光环_GetToken.js, tag=鑫耀光环Token抓取, requires-body=false, timeout=10, enabled=true
 *
 * [MITM]：
 * hostname = crm.theringlive.com
 */

var STORE_KEY = "XYHG_Authorization";

(function () {
  var headers = $request.headers || {};
  var auth = null;

  // HTTP headers 大小写不固定，遍历查找
  for (var key in headers) {
    if (key.toLowerCase() === "authorization") {
      auth = headers[key];
      break;
    }
  }

  if (!auth || auth.indexOf("Bearer ") !== 0) {
    $done({});
    return;
  }

  // 与已存储的值比较，相同则不更新不通知
  var saved = $persistentStore.read(STORE_KEY);
  if (saved === auth) {
    $done({});
    return;
  }

  // 不同则更新并通知
  var ok = $persistentStore.write(auth, STORE_KEY);
  if (ok) {
    $notification.post("鑫耀光环 Token", "会员 Token 已更新", auth.substring(7, 27) + "...");
  } else {
    $notification.post("鑫耀光环 Token", "保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
