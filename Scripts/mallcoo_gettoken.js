/**
 * mallcoo 商场系统 - Token 自动抓取（龙之梦/大悦城等猫酷系统商场通用）
 *
 * 功能：拦截 m.mallcoo.cn 的 POST 请求，从请求体 JSON 中提取 Header.Token 和 MallID，
 *       持久化到本地存储。Token 相同时静默跳过，不同时更新并通知。
 *
 * Loon [Script] 配置：
 * http-request ^https:\/\/m\.mallcoo\.cn\/api\/user\/User\/GetCheckinDetail script-path=mallcoo_gettoken.js, tag=mallcooToken抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = m.mallcoo.cn
 */

var STORE_PREFIX = "MALLCOO_";

(function () {
  var body = $request.body || "";

  if (!body) {
    $done({});
    return;
  }

  // 解析请求体 JSON
  var data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    $done({});
    return;
  }

  var token = null;
  var mallId = null;

  // 从 Header.Token 中提取
  if (data.Header && data.Header.Token) {
    token = data.Header.Token;
  }

  // 提取 MallID（可能是 MallID 或 MallId）
  if (data.MallID) {
    mallId = data.MallID;
  } else if (data.MallId) {
    mallId = data.MallId;
  }

  if (!token) {
    $done({});
    return;
  }

  // 用 MallID 区分不同商场
  var storeKey = STORE_PREFIX + "Token_" + (mallId || "default");
  var mallKey = STORE_PREFIX + "MallID_" + (mallId || "default");

  // 相同则不更新不通知
  var saved = $persistentStore.read(storeKey);
  if (saved === token) {
    $done({});
    return;
  }

  // 不同则更新并通知
  var ok = $persistentStore.write(token, storeKey);
  if (mallId) {
    $persistentStore.write(String(mallId), mallKey);
  }

  if (ok) {
    var mallName = "商场" + mallId;
    if (mallId === 12626) {
      mallName = "龙之梦城市生活中心";
    }
    $notification.post(
      "mallcoo Token",
      mallName + " 已更新",
      "Token: " + token.substring(0, 20) + "..."
    );
  } else {
    $notification.post("mallcoo Token", "保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
