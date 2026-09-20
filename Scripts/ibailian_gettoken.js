/**
 * i百联 - Token 自动抓取
 *
 * 功能：拦截 mh5.bl.com/h5_gateway/ 请求，提取 membertoken + devicekey + sm-deviceid
 *       组合为 JSON 凭证持久化到账号1。
 *       - 仅当 membertoken 变化时才弹通知（devicekey/sm-deviceid 变化静默更新）
 *       - 凭证相同时完全静默跳过
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

  var newCreds = {
    membertoken: token,
    devicekey: getHeader("devicekey") || "",
    smDeviceid: getHeader("sm-deviceid") || ""
  };

  var newStr = JSON.stringify(newCreds);
  var saved = $persistentStore.read(STORE_KEY);

  // 完全相同 → 静默跳过
  if (saved === newStr) {
    $done({});
    return;
  }

  // 解析旧凭证，比较 membertoken
  var oldToken = "";
  if (saved) {
    try {
      var oldCreds = JSON.parse(saved);
      oldToken = oldCreds.membertoken || "";
    } catch (e) {
      oldToken = "";
    }
  }

  // 写入最新凭证（始终保持 devicekey/sm-deviceid 最新）
  var ok = $persistentStore.write(newStr, STORE_KEY);

  // 仅当 membertoken 真正变化时才弹通知
  if (oldToken !== token) {
    if (ok) {
      $notification.post("i百联 Token", "账号1 已更新", token.substring(0, 20) + "...");
    } else {
      $notification.post("i百联 Token", "账号1 保存失败", "写入 persistentStore 失败");
    }
  }

  $done({});
})();
