hostname = user-api.smzdm.com,c.tieba.baidu.com,tiebac.baidu.com,maicai.api.ddxq.mobi,passport.iqiyi.com

# blackmatrix7
# 什么值得买每日自动签到
^https?:\/\/user-api\.smzdm\.com\/checkin$ url script-request-header https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/smzdm/smzdm_daily.js
# 百度贴吧每日自动签到
^https?:\/\/(c\.tieba\.baidu\.com|180\.97\.\d+\.\d+)\/c\/s\/login url script-request-header https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/tieba/tieba_signin.js
^https?:\/\/c\.tieba\.baidu\.com\/c\/s\/channelIconConfig url script-request-header https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/tieba/tieba_signin.js
^https?:\/\/tiebac\.baidu\.com\/c\/u\/follow\/getFoldedMessageUserInfo url script-request-header https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/tieba/tieba_signin.js
# 叮咚买菜每日自动签到
^https?:\/\/maicai\.api\.ddxq\.mobi\/point\/home\?api_version url script-request-header https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/dingdong/dingdong_checkin.js

# 爱奇艺
^https:\/\/passport\.iqiyi\.com\/apis\/user\/ url script-request-header https://raw.githubusercontent.com/NobyDa/Script/master/iQIYI-DailyBonus/iQIYI.js
