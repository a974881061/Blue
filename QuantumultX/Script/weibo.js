// ==UserScript==
// @ScriptName        微博&微博国际版净化
// @Author            @ddgksf2013,@zmqcherish,@shiro
// @ForHelp           若有屏蔽广告的需求，可公众号后台回复APP名称
// @WechatID          公众号墨鱼手记
// @TgChannel         https://t.me/ddgksf2021
// @Contribute        https://t.me/ddgksf2013_bot
// @Feedback          📮 ddgksf2013@163.com 📮
// @UpdateTime        2022-12-20
// @Attention         微博、微博国际版净化，现已二合一，使用中若有问题请发邮件！
// @Function          让你更加愉悦的刷微博
// @Suitable          自行观看“# > ”注释内容
// @Attention         如需引用请注明出处，谢谢合作！
// @Version           V2.0.9
// @ScriptURL         https://github.com/ddgksf2013/Rewrite/raw/master/AdBlock/Weibo.conf
// ==/UserScript==

# 𝐂𝐮𝐭𝐭𝐥𝐞𝐟𝐢𝐬𝐡 𝐒𝐞𝐥𝐟-𝐮𝐬𝐞 𝐑𝐞𝐰𝐫𝐢𝐭𝐞 𝐂𝐨𝐧𝐟𝐢𝐠𝐮𝐫𝐚𝐭𝐢𝐨𝐧 𝐂𝐡𝐚𝐧𝐠𝐞𝐥𝐨𝐠 𝐂𝐫𝐞𝐚𝐭𝐞𝐝 𝐛𝐲 𝐝𝐝𝐠𝐤𝐬𝐟𝟐𝟎𝟏𝟑 𝐚𝐧𝐝 𝐳𝐦𝐪𝐜𝐡𝐞𝐫𝐢𝐬𝐡
# [+]202X-XX-XX  01、删除首页(tab1)流和超话中的广告、热推删除视频号(tab2)流中的广告，删除发现页(tab3)轮播广告图
# [+]202X-XX-XX  02、删除个人页(tab5)中的创作者中心下方的轮播图、为你推荐、用户任务和VIP一栏（可配置）
# [+]202X-XX-XX  03、删除微博详情页的广告、相关推荐、微博主好物种草和关注博主模块（可配置），删除微博开屏广告 | 参考@yichahucha
# [+]202X-XX-XX  04、删除tab2菜单中的虚假通知，删除tab1顶部的签到和直播（可配置），删除微博详情页菜单栏的新鲜事头像挂件等（可配置）
# [+]202X-XX-XX  05、删除微博详情页评论区相关内容（可配置，默认关闭），删除微博详情页评论区推荐内容（可配置，默认打开）
# [+]202X-XX-XX  06、删除超话中可能感兴趣的超话、超话中的好友、超话好友关注、用户页可能感兴趣的人（可配置，默认关闭）
# [+]202X-XX-XX  07、删除搜索结果页广告，将个人主页关注按钮默认值由推荐改为关注的人
# [+]202X-XX-XX  08、自定义个人主页图标（可配置，默认关闭）效果图，关闭自动播放下一个视频（可配置，默认关闭）
# [+]202X-XX-XX  09、删除微博详情页打赏模块（可配置，默认关闭），自定义底部tab图标（可配置，默认关闭）效果图
# [+]202X-XX-XX  10、已删除移除tab5新任务通知，原样式，删除绿洲模块（可配置，默认关闭）
# [+]202X-XX-XX  11、待定自定义开屏图片/视频。如有需求，可以考虑开发，删除个人页让“红包飞模块”
# [+]2022-03-12  12、新增屏蔽用户功能，如果有不得已需要关注的人（比如某些抽奖关注），但是又不想看TA的内容可以使用此配置。
# [+]2022-05-22  13、重新删除发现页(tab3)轮播广告图，需要配置weibo_config.js -> removeSearchWindow为true，其实轮播中有些不是广告，一起杀
# [+]2022-07-12  14、删除消息页动态流的广告
# [+]2022-08-22  15、删除超话tab页无关元素（可配置）
# [+]2022-08-23  16、删除微博详情页超话新帖和新用户相关提示
# [+]2022-09-02  17、删除初次打开搜索页的轮播图
# [+]2022-09-12  18、修复超话无法签到bug
# [+]2022-10-11  19、移除首页新版广告
# [+]2022-10-24  20、移除用户页新版广告
# [+]2022-12-14  21、将微博国际版去广告与微博去广告二合一，删除微博发现页的轮播图，add key removeSearchWindow for true
# [+]2022-12-15  22、更换微博国际版去广告的search_topic
# [+]2022-12-15  23、微博国际版去广告不再采用单一reject方式，利用脚本去广告
# [+]2022-12-15  24、去除微博我的页面“绿荫总动员”条幅，去除微博搜索框填词
# [+]2022-12-15  25、修复微博热搜界面“要闻”与“同城”无法打开的bug
# [+]2022-12-15  26、去除我的、热搜、文娱列表广告内容
# [+]2022-12-16  27、请手动添加后面的分流至本地 host, sdkapp.uve.weibo.com, direct
# [+]2022-12-16  28、删除主页顶部“#记录周五的开心时刻#”，去除搜索页面“实况热聊”栏以及group栏
# [+]2022-12-16  29、删除微博评论详情页面最底部的“已过滤不当言论，部分评论暂不展示”等文字
# [-]2022-12-17  30、脚本weibo_json.js已解除限制，其它工具诸如surge、Loon亦可使用
# [+]2022-12-18  31、优化超话tab看帖页面，保留搜索(去除自动填充内容)及感兴趣的超话以及去除一些无关group和card
# [+]2022-12-20  32、删除超话搜索栏目下方的“可能感兴趣”、“热门超话”、“影视超话”、“游戏超话”等card


hostname = *api.weibo*, *uve.weibo.com, new.vip.weibo.cn
# > 微博_请手动添加以下分流至本地
#host, sdkapp.uve.weibo.com, direct
# > 微博_自定义tab皮肤@zmqcherish
^https://api.weibo.cn/2/!/client/light_skin url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
# > 微博_非会员设置tab皮肤@zmqcherish
^https://new.vip.weibo.cn/littleskin/preview url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
# > 微博_去广告以及去除各部分推广模块@zmqcherish
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/(searchall|page\?|messageflow) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/statuses/(unread_)?friends(/|_)timeline url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/groups/timeline url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/statuses/(container_timeline|unread_hot_timeline|extend|video_mixtimeline|unread_topic_timeline) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/profile/(me|container_timeline) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/video/(community_tab|remind_info|tiny_stream_video_list) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/search/(finder|container_timeline|container_discover) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/(checkin/show|\!/live/media_homelist|comments/build_comments|container/get_item) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/cardlist url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
# > 微博国际版_hot_search@ddgksf2013
^https?:\/\/weibointl\.api\.weibo\.c(n|om)\/portal\.php\?a=hot_search_users url reject-dict
# > 微博国际版_热推荐@ddgksf2013
^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/ad\/weibointl\? url reject-dict
# > 微博国际版_屏蔽search_suggest@ddgksf2013
# ^https?:\/\/m?api\.weibo\.c(n|om)\/\d\/page\/get_search_suggest url reject-dict
# > 微博国际版_屏蔽searching_info@ddgksf2013
^https?:\/\/weibointl\.api\.weibo\.c(n|om)\/portal\.php.*user&a=get_searching_info url echo-response text/html echo-response https://github.com/ddgksf2013/Scripts/raw/master/weibo_search_info.json
# > 微博国际版_屏蔽search_topic@ddgksf2013 
^https?:\/\/weibointl\.api\.weibo\.c(n|om)\/portal\.php.*feed&a=search_topic url echo-response text/html echo-response https://github.com/ddgksf2013/Scripts/raw/master/weibo_search_topic.json
# > 微博国际版_屏蔽开屏广告@ddgksf2013 
^https?:\/\/weibointl\.api\.weibo\.c(n|om)\/portal\.php.*get_coopen_ads url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
# > 微博&国际版_sdkad@ddgksf2013
^https?://(sdk|wb)app\.uve\.weibo\.com(/interface/sdk/sdkad.php|/wbapplua/wbpullad.lua) url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
# > 微博国际版_趋势顶部CARD去广告@ddgksf2013
^https?:\/\/weibointl\.api\.weibo\.c(n|om)\/portal\.php.*feed&a=trends url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
# > 微博国际版_用户中心@ddgksf2013
^https?:\/\/weibointl\.api\.weibo\.cn\/portal\.php\?a=user_center url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/weibo_json.js
   
