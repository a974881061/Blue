/**
 * mallcoo 猫酷商场系统 - Token 自动抓取（极简调试版）
 *
 * Loon [Script] 配置：
 * http-request ^https:\/\/m\.mallcoo\.cn\/ script-path=mallcoo_gettoken.js, tag=mallcooToken抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = m.mallcoo.cn
 */

var STORE_PREFIX = "MALLCOO_";

console.log("=== mallcoo gettoken 开始执行 ===");

if (typeof $request === "undefined") {
  console.log("错误: $request 不存在，当前脚本类型不是 http-request");
  $done({});
}

console.log("请求URL: " + $request.url);
console.log("请求方法: " + $request.method);

var body = $request.body;
console.log("请求体类型: " + typeof body);
console.log("请求体长度: " + (body ? body.length : 0));

if (!body) {
  console.log("请求体为空，跳过");
  $done({});
}

// 尝试解析 JSON
var data;
if (typeof body === "string") {
  try {
    data = JSON.parse(body);
    console.log("JSON 解析成功");
  } catch (e) {
    console.log("JSON 解析失败: " + e.message);
    console.log("body 前100字符: " + body.substring(0, 100));
    $done({});
  }
} else if (typeof body === "object") {
  data = body;
  console.log("body 已经是对象");
} else {
  console.log("body 类型不支持: " + typeof body);
  $done({});
}

// 提取 Token 和 MallID
var token = "";
var mallId = "";

if (data.Header && data.Header.Token) {
  token = data.Header.Token;
  console.log("找到 Token: " + token.substring(0, 20) + "...");
} else {
  console.log("未找到 Header.Token");
  console.log("data.Header: " + JSON.stringify(data.Header));
}

if (data.MallID) {
  mallId = String(data.MallID);
} else if (data.MallId) {
  mallId = String(data.MallId);
}
console.log("MallID: " + mallId);

if (!token || !mallId) {
  console.log("Token 或 MallID 为空，跳过");
  $done({});
}

// 保存 Token
var tokenKey = STORE_PREFIX + "Token_" + mallId;
var oldToken = $persistentStore.read(tokenKey);

if (oldToken === token) {
  console.log("Token 未变化，跳过");
  $done({});
}

var ok = $persistentStore.write(token, tokenKey);
if (ok) {
  console.log("Token 保存成功！");

  // 保存域名和商场名
  var domain = "m.mallcoo.cn";
  if ($request.url.indexOf("joycity") >= 0) {
    domain = "m-crm.joycity.mobi";
  }
  $persistentStore.write(domain, STORE_PREFIX + "Domain_" + mallId);

  var mallName = "商场" + mallId;
  if (mallId === "12626") mallName = "龙之梦城市生活中心";
  if (mallId === "10024") mallName = "静安大悦城";
  $persistentStore.write(mallName, STORE_PREFIX + "Name_" + mallId);

  // 更新商场列表
  var listStr = $persistentStore.read("MALLCOO_MallList");
  var list = [];
  try {
    if (listStr) list = JSON.parse(listStr);
  } catch (e) {}

  var exists = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].mallId === mallId) {
      exists = true;
      list[i].name = mallName;
      list[i].domain = domain;
      break;
    }
  }
  if (!exists) {
    list.push({ mallId: mallId, name: mallName, domain: domain });
  }
  $persistentStore.write(JSON.stringify(list), "MALLCOO_MallList");

  $notification.post("mallcoo 签到 Token", mallName + " 已更新", "Token: " + token.substring(0, 20) + "...");
} else {
  console.log("Token 保存失败！");
  $notification.post("mallcoo 签到 Token", "保存失败", "写入 persistentStore 失败");
}

console.log("=== mallcoo gettoken 执行结束 ===");
$done({});
