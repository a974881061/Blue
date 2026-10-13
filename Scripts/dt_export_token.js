/**
 * DT生活 - Token 导出工具
 *
 * 用法：手机 Safari 访问  http://dt.local/token
 * 原理：Loon 在请求发出前拦截该伪 URL，直接由本地返回一个网页，
 *       页面里展示 Loon 持久存储中的 DT_LIFE_TOKEN，点按钮即可复制，
 *       用于填入青龙环境变量 dtsh_token。
 *
 * 对应插件规则：
 * http-request ^https?:\/\/dt\.local\/token script-path=dt_export_token.js
 */

var token = ($persistentStore.read("DT_LIFE_TOKEN") || "").trim();

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

var html =
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  "<title>DT生活 Token</title>" +
  "<style>" +
  "body{font-family:-apple-system,sans-serif;margin:0;padding:24px;background:#f5f6f8;color:#222}" +
  ".card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.06)}" +
  "h2{margin:0 0 12px;font-size:18px}" +
  "textarea{width:100%;height:110px;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;" +
  "padding:10px;font-size:13px;resize:none;font-family:Menlo,monospace}" +
  "button{margin-top:14px;width:100%;padding:14px;border:0;border-radius:12px;background:#07c160;color:#fff;font-size:16px}" +
  ".tip{margin-top:12px;font-size:12px;color:#888;line-height:1.6}" +
  ".empty{color:#e64340}" +
  "</style></head><body><div class=card>" +
  "<h2>DT生活 Token</h2>" +
  (token
    ? '<textarea id=t readonly>' + esc(token) + "</textarea>" +
      '<button onclick="cp()">复制 Token</button>' +
      '<div class=tip>复制后到青龙面板新建环境变量 <b>dtsh_token</b>，粘贴即可。<br>失效时重新打开一次 DT生活小程序，再回本页复制新值。</div>'
    : '<p class="empty">尚未抓到 Token，请先打开一次「DT生活」微信小程序，再刷新本页。</p>' +
      '<div class=tip>抓包规则：Loon 插件已启用，域名 ebeikeapi.ebeck.cn。</div>') +
  "</div>" +
  "<script>" +
  "function cp(){var t=document.getElementById('t');t.select();" +
  "if(navigator.clipboard){navigator.clipboard.writeText(t.value).then(ok)}else{document.execCommand('copy');ok()}}" +
  "function ok(){var b=document.querySelector('button');b.innerText='已复制 ✓';setTimeout(function(){b.innerText='复制 Token'},1500)}" +
  "</script></body></html>";

$done({
  response: {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  },
});
