import json

import requests

url = 'https://superapp.kiwa-tech.com/app/activityComment/participatePrizes/sendComment'

headers = {
    'Cookie':'SERVERID=0b2a4f7a50c3c34feed8c5c120823b69|1649226554|1649226478; acw_tc=276077c416492264784277475e2058ab96fffe3bdc99c2eb5d7a1bab4e5da6; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22n-24176403%22%2C%22first_id%22%3A%2217f810aa4ad1310-02da311f1917de8-5148017e-329160-17f810aa4ae26ae%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22%24device_id%22%3A%2217f810aa4ad1310-02da311f1917de8-5148017e-329160-17f810aa4ae26ae%22%7D; _HAIDILAO_APP_TOKEN=TOKEN_APP_b8053f33-408f-4d1b-a31b-828b4f860d8e',
    'Connection':'keep-alive',
    'Accept-Encoding':'gzip, deflate, br',
    'version':'2',
    'publicAttribute':'%7B%0A%20%20%22%24app_id%22%20%3A%20%22app.haidilao.HaidilaoMobileDistribution%22%2C%0A%20%20%22%24screen_width%22%20%3A%20390%2C%0A%20%20%22%24app_version%22%20%3A%20%228.3.0%22%2C%0A%20%20%22all_country%22%20%3A%20%22%E4%B8%AD%E5%9B%BD%22%2C%0A%20%20%22all_platform%22%20%3A%20%22%E6%B5%B7%E5%BA%95%E6%8D%9EApp%22%2C%0A%20%20%22%24is_first_day%22%20%3A%20false%2C%0A%20%20%22%24model%22%20%3A%20%22iPhone14%2C5%22%2C%0A%20%20%22%24device_id%22%20%3A%20%224CF6EC8F-C9B0-4431-8570-E63CD73635DE%22%2C%0A%20%20%22%24network_type%22%20%3A%20%22WIFI%22%2C%0A%20%20%22%24carrier%22%20%3A%20%22%E4%B8%AD%E5%9B%BD%E8%81%94%E9%80%9A%22%2C%0A%20%20%22%24timezone_offset%22%20%3A%20-480%2C%0A%20%20%22%24wifi%22%20%3A%20true%2C%0A%20%20%22all_current_growth_value%22%20%3A%203541%2C%0A%20%20%22%24app_name%22%20%3A%20%22%E6%B5%B7%E5%BA%95%E6%8D%9E%22%2C%0A%20%20%22all_current_score_value%22%20%3A%20974%2C%0A%20%20%22all_city%22%20%3A%20%22%E7%A6%8F%E5%B7%9E%E5%B8%82%22%2C%0A%20%20%22%24screen_height%22%20%3A%20844%2C%0A%20%20%22%24lib_version%22%20%3A%20%224.0.3%22%2C%0A%20%20%22%24os_version%22%20%3A%20%2215.4.1%22%2C%0A%20%20%22%24lib%22%20%3A%20%22iOS%22%2C%0A%20%20%22all_current_member_cate%22%20%3A%20%222%22%2C%0A%20%20%22%24manufacturer%22%20%3A%20%22Apple%22%2C%0A%20%20%22%24os%22%20%3A%20%22iOS%22%0A%7D',
    '_HAIDILAO_APP_TOKEN':'TOKEN_APP_b8053f33-408f-4d1b-a31b-828b4f860d8e',
    'Content-Type':'application/json',
    'X-Device-Mobile-Name':'Blue',
    'sysType':'IOS',
    'User-Agent':'HaiDiLao/8.3.0 (iPhone; iOS 15.4; Scale/3.00)',
    'X-Device-Mobile-Type':'iPhone 13',
    'X-Device-Model':'Phone',
    'sensorsAnalyticsId':'8A6C5C0A-2A46-40D0-A22C-5C51685280A6',
    'Host' : 'superapp.kiwa-tech.com',
    'X-Source' : 'app',
    'X-Device-Id' : 'YRXeEqTa/ggDALirngZdlkd2',
    'Accept-Language' : 'zh-Hans-CN;q=1',
    'Accept' : 'application/json'
}

#body = '{"content":"海底捞今日份打卡","activityId":"10","uid":"n-24176403","loginToken":"TOKEN_APP_b8053f33-408f-4d1b-a31b-828b4f860d8e","customerId":"n-24176403","pubUserId":"n-50301732","cid":1437644}'.encode('utf-8')
body = {
    "content":"海底捞今日份打卡",
    "activityId":"10",
    "uid":"n-24176403",
    "loginToken":"TOKEN_APP_b8053f33-408f-4d1b-a31b-828b4f860d8e",
    "customerId":"n-24176403",
    "pubUserId":"n-50301732",
    "cid":1437644
}

res =requests.post(url=url,headers=headers,data=json.dumps(body)).json()
print(res)

if res['code'] == 'ok':
    url = 'https://api.day.app/fC842SsyD8qeqpFw2vp65S/海底捞/签到成功,打卡层数：{}?icon=https://raw.githubusercontent.com/a974881061/Blue/main/icons/hdl.jpg'.format(res['data'])
    requests.get(url=url)
else:
    url = 'https://api.day.app/fC842SsyD8qeqpFw2vp65S/海底捞签到失败/{}?icon=https://raw.githubusercontent.com/a974881061/Blue/main/icons/hdl.jpg'.format(res['code'])
    requests.get(url=url)


