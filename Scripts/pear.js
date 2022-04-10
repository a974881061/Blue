/*
圈x
下载地址https://www.pears.live/
[rewrite_local]
#雪梨解锁会员
^https://(bkcd.b-cdn.net|souhu.mett.me|m.pearkin.com|www.baidu.com2.club|cn.baidu-ch.com)\/api(\/account|\/movie|\/video)(\/IndexDetail|\/IsVip|\/WatchMovieNew|\/watch|\/CheckVip)  url script-response-body  https://cdn.jsdelivr.net/gh/byxiaopeng/myscripts@main/vip/xlsp.js
[mitm]
hostname= m.pearkin.com,bkcd.b-cdn.net,souhu.mett.me,www.baidu.com2.club,cn.baidu-ch.com
破解内容：视频无线看
*/
var body = $response.body;
var obj = JSON.parse(body);

if ($request.url.indexOf("/api/account/IndexDetail") != -1) {
  obj.nickName = "️大咪咪";
  obj.vipEndTime = "2099-09-09";
  obj.cartoonVip = true;
  obj.vipLevel = 101;
  obj.cartoonVipEndTime = "2099-09-09";
  body = JSON.stringify(obj);
}

if ($request.url.indexOf("/api/account/IsVip") != -1) {
  obj.value = true;
  body = JSON.stringify(obj);
}
if ($request.url.indexOf("/api/account/CheckVip") != -1) {
  obj.value = true;
  body = JSON.stringify(obj);
}
if ($request.url.indexOf("/api/movie/WatchMovieNew") != -1) {
  obj.canWath = true;
  body = JSON.stringify(obj);
}

if ($request.url.indexOf("/api/video/watch/") != -1) {
  body = JSON.stringify(obj);
}


$done({ body });
