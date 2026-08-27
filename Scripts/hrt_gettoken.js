/**
 * 华润通 - 签到凭证自动抓取
 *
 * 功能：拦截 saveQuestionSignin 请求，提取加密请求体作为签到凭证。
 *       华润通签到 API 使用全加密 body，无法提取独立 token，
 *       因此抓取整个请求体供签到脚本回放。
 *       凭证相同时静默跳过，不同时更新并通知。
 *
 * Loon [Script] 配置：
 * http-request ^https://mid\.huaruntong\.cn/api/points/saveQuestionSignin$ script-path=hrt_gettoken.js, tag=华润通凭证抓取, requires-body=true, timeout=10, enabled=true
 *
 * Loon [MITM]：
 * hostname = mid.huaruntong.cn
 */

var STORE_KEY = "HRT_Body_1";

(function () {
  // 只处理 POST 请求
  if ($request.method !== "POST") {
    $done({});
    return;
  }

  var body = $request.body;
  if (!body) {
    $done({});
    return;
  }

  // 相同则不更新不通知
  var saved = $persistentStore.read(STORE_KEY);
  if (saved === body) {
    $done({});
    return;
  }

  // 不同则更新并通知
  var ok = $persistentStore.write(body, STORE_KEY);
  if (ok) {
    $notification.post("华润通凭证", "账号1 已更新", "签到凭证已保存，可等待每日自动签到");
  } else {
    $notification.post("华润通凭证", "账号1 保存失败", "写入 persistentStore 失败");
  }

  $done({});
})();
