/**
 * DT生活小程序 - API 接口探测器（临时排查工具，用完请在插件中禁用）
 *
 * 作用：记录 ebeck.cn 所有接口的真实路径、请求参数、返回数据，
 *       用于发现商品列表 / 商品详情 / 价格相关接口。
 *
 * 发现的每个新路径会：
 *   1. 弹一条通知（含返回内容前 220 字）
 *   2. 完整样本写入持久化 key: DT_API_MAP（可在 Loon 日志中查看）
 *
 * 安全：日志与样本中的 token 自动打码，仅保留前 6 位。
 */

var MAP_KEY = "DT_API_MAP";
var MAX_ENDPOINTS = 80;
var RESP_SAMPLE_LEN = 1200;
var LOG_SNIPPET_LEN = 220;

function maskToken(text) {
  if (!text) return "";
  return String(text)
    .replace(/("token"\s*:\s*")([^"]{6})[^"]*"/gi, '$1$2***"')
    .replace(/(Bearer\s+)([A-Za-z0-9]{6})[A-Za-z0-9._-]*/gi, "$1$2***")
    .replace(/("appId"\s*:\s*")([^"]{6})[^"]*"/gi, '$1$2***"');
}

function safeParseJSON(raw) {
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function pathOnly(url) {
  var q = url.indexOf("?");
  return q >= 0 ? url.substring(0, q) : url;
}

function snippet(text, n) {
  text = String(text || "");
  return text.length > n ? text.substring(0, n) + "…" : text;
}

function main() {
  try {
    var fullUrl = $request.url || "";
    var method = $request.method || "POST";
    var path = pathOnly(fullUrl);

    var reqBody = "";
    if (typeof $request.body === "string") reqBody = $request.body;
    else if ($request.body && typeof $request.body === "object") reqBody = JSON.stringify($request.body);

    var respBody = "";
    if (typeof $response !== "undefined" && $response) {
      if (typeof $response.body === "string") respBody = $response.body;
      else if ($response.body && typeof $response.body === "object") respBody = JSON.stringify($response.body);
    }

    var map = safeParseJSON($persistentStore.read(MAP_KEY)) || {};
    var isNew = !map[path];

    if (isNew) {
      var keys = Object.keys(map);
      if (keys.length >= MAX_ENDPOINTS) { delete map[keys[0]]; }
      map[path] = {
        method: method,
        query: fullUrl.indexOf("?") >= 0 ? fullUrl.split("?")[1] : "",
        reqSample: maskToken(snippet(reqBody, 500)),
        respSample: snippet(respBody, RESP_SAMPLE_LEN),
        firstSeen: new Date().toISOString()
      };
      $persistentStore.write(JSON.stringify(map), MAP_KEY);

      console.log("[DT探测] 🆕 新接口 " + method + " " + path);
      console.log("[DT探测] 请求体: " + maskToken(reqBody));
      console.log("[DT探测] 返回体: " + respBody);

      // 标记返回中疑似价格字段
      var priceHit = "";
      var pm = respBody.match(/"[a-zA-Z_]*(price|money|amount|gold|points|integral)[a-zA-Z_]*"\s*:\s*[^,}\]]{1,20}/i);
      if (pm) priceHit = "💰" + pm[0] + "\n";

      $notification.post(
        "DT接口发现 " + method,
        path.replace("https://", "").replace("ebeikeapi.ebeck.cn", ""),
        priceHit + snippet(respBody.replace(/\\u[\da-f]{4}/gi, ""), LOG_SNIPPET_LEN)
      );
    } else {
      console.log("[DT探测] 已记录 " + method + " " + path);
    }
  } catch (e) {
    console.log("[DT探测] 异常: " + (e.message || e));
  }
  $done({});
}

main();
