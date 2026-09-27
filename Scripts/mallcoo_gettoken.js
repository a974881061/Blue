/**
 * mallcoo 猫酷商场系统 - Token 自动抓取（通用版）
 *
 * 支持的商场系统域名：
 *   - m.mallcoo.cn (龙之梦等)
 *   - m-crm.joycity.mobi (大悦城等)
 *
 * 功能：拦截签到相关请求，从请求体 JSON 中提取 Header.Token 和 MallID，
 *       自动识别商场名称，持久化到本地存储。
 *       Token 相同时静默跳过，不同时更新并通知。
 *
 * Loon [Script] 配置（龙之梦）：
 * http-request ^https:\/\/m\.mallcoo\.cn\/api\/user\/User\/GetCheckinDetail script-path=mallcoo_gettoken.js, tag=mallcooToken抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [Script] 配置（大悦城）：
 * http-request ^https:\/\/m-crm\.joycity\.mobi\/api\/user\/User\/GetCheckinDetail script-path=mallcoo_gettoken.js, tag=大悦城Token抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = m.mallcoo.cn, m-crm.joycity.mobi
 */

var STORE_PREFIX = "MALLCOO_";
var MALL_LIST_KEY = "MALLCOO_MallList";

// 已知商场映射
var MALL_NAMES = {
  "12626": "龙之梦城市生活中心",
  "10024": "静安大悦城"
};

(function () {
  try {
    var body = $request.body || "";
    var url = $request.url || "";

    console.log("mallcoo gettoken: 拦截到请求: " + url.substring(0, 80));

    if (!body) {
      console.log("mallcoo gettoken: 请求体为空，跳过");
      $done({});
      return;
    }

    // 解析请求体 JSON
    var data;
    try {
      if (typeof body === "object") {
        data = body;
      } else {
        data = JSON.parse(body);
      }
    } catch (e) {
      console.log("mallcoo gettoken: 解析请求体失败: " + e.message);
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
      mallId = String(data.MallID);
    } else if (data.MallId) {
      mallId = String(data.MallId);
    }

    if (!token || !mallId) {
      console.log("mallcoo gettoken: 未找到 Token 或 MallID");
      $done({});
      return;
    }

    // 从 URL 提取域名
    var domain = "";
    var match = url.match(/^https?:\/\/([^\/]+)/);
    if (match) {
      domain = match[1];
    }

    console.log("mallcoo gettoken: 找到 Token, mallId=" + mallId + ", domain=" + domain);

    // 存储 key
    var tokenKey = STORE_PREFIX + "Token_" + mallId;
    var domainKey = STORE_PREFIX + "Domain_" + mallId;
    var nameKey = STORE_PREFIX + "Name_" + mallId;

    // 相同则不更新不通知
    var saved = "";
    try {
      saved = $persistentStore.read(tokenKey);
    } catch (e) {}

    if (saved === token) {
      console.log("mallcoo gettoken: Token 未变化，跳过");
      $done({});
      return;
    }

    // 获取商场名称
    var mallName = MALL_NAMES[mallId] || ("商场" + mallId);

    // 保存 Token
    var ok = false;
    try {
      ok = $persistentStore.write(token, tokenKey);
    } catch (e) {
      console.log("mallcoo gettoken: 保存 Token 失败: " + e.message);
    }

    if (ok) {
      // 保存域名和名称
      if (domain) {
        try { $persistentStore.write(domain, domainKey); } catch (e) {}
      }
      try { $persistentStore.write(mallName, nameKey); } catch (e) {}

      // 更新商场列表
      try { updateMallList(mallId, mallName, domain); } catch (e) {
        console.log("mallcoo gettoken: 更新商场列表失败: " + e.message);
      }

      console.log("mallcoo gettoken: Token 已更新: " + mallName);
      try {
        $notification.post(
          "mallcoo 签到 Token",
          mallName + " 已更新",
          "Token: " + token.substring(0, 20) + "..."
        );
      } catch (e) {
        console.log("mallcoo gettoken: 发送通知失败: " + e.message);
      }
    } else {
      try {
        $notification.post("mallcoo 签到 Token", "保存失败", "写入 persistentStore 失败");
      } catch (e) {}
    }

    $done({});
  } catch (e) {
    console.log("mallcoo gettoken: 脚本异常: " + e.message);
    $done({});
  }
})();

// 更新商场列表
function updateMallList(mallId, mallName, domain) {
  var listStr = "";
  try {
    listStr = $persistentStore.read(MALL_LIST_KEY);
  } catch (e) {}

  var list = [];
  if (listStr) {
    try {
      list = JSON.parse(listStr);
    } catch (e) {
      list = [];
    }
  }

  // 检查是否已存在
  var exists = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].mallId === mallId) {
      exists = true;
      list[i].name = mallName;
      if (domain) {
        list[i].domain = domain;
      }
      break;
    }
  }

  if (!exists) {
    list.push({
      mallId: mallId,
      name: mallName,
      domain: domain || ""
    });
  }

  try {
    $persistentStore.write(JSON.stringify(list), MALL_LIST_KEY);
  } catch (e) {
    console.log("mallcoo gettoken: 保存商场列表失败: " + e.message);
  }
}
