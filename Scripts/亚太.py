import requests

url = 'https://ad.paperone.com.cn:5001/api/WxScore/AddScoreSign'
url1 = 'https://ad.paperone.com.cn:5001/api/WxcScoreInfo/AddScoreSign'
url2 = 'https://ad.paperone.com.cn:5001/api/WxcScoreInfo/AddScoreShare'
url3 = 'https://ad.paperone.com.cn:5001/api/WxScore/AddScoreShare'

headers = {
    'Host': 'ad.paperone.com.cn:5001',
    'Connection': 'keep-alive',
    'Mycon-Agent': 'wx_mp',
    'content-type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NjIyIiwiaWF0IjoiMTYzMzgyNTMwMSIsIm5iZiI6IjE2MzM4MjUzMDEiLCJleHAiOiIxNjMzODU0MTAxIiwiaXNzIjoiTmV0c2VydmVyQVBJIiwiYXVkIjoiVXNlciIsIm5hbWVpZCI6Ijk2MjIiLCJ1c2VySWQiOiI5NjIyIiwidXNlckluZm9JZCI6Ijk2MjIiLCJ1c2VyQWNjb3VudCI6IueUqOaItzk2MjIiLCJyb2xlIjoiMCJ9.rKlnFoMJrI8riOzmoX7lcm3IbI3pxCGBHkE9hE8ow4I',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip,compress,br,deflate',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.14(0x18000e2a) NetType/WIFI Language/zh_CN',
    'Referer': 'https://servicewechat.com/wx4e7673de6249af1f/34/page-frame.html'
}

headers1 = {
    'Host': 'ad.paperone.com.cn:5001',
    'Connection': 'keep-alive',
    'Mycon-Agent': 'wx_mp',
    'content-type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MTkxMSIsImlhdCI6IjE2MzM4MjUzMTEiLCJuYmYiOiIxNjMzODI1MzExIiwiZXhwIjoiMTYzMzg1NDExMSIsImlzcyI6Ik5ldHNlcnZlckFQSSIsImF1ZCI6IlVzZXIiLCJuYW1laWQiOiI4MTkxMSIsInVzZXJJZCI6IjgxOTExIiwidXNlckluZm9JZCI6IjgxOTExIiwidXNlckFjY291bnQiOiLnlKjmiLc4MTkxMSIsInJvbGUiOiIwIn0.QkFzkP7ZMtGjxGwfJESfFkPlkVxRfWkI_q1_vaERblg',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip,compress,br,deflate',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.14(0x18000e2a) NetType/WIFI Language/zh_CN',
    'Referer': 'https://servicewechat.com/wxa8abc2aa9e0684e0/57/page-frame.html'
}

headers2 = {
    'Host': 'ad.paperone.com.cn:5001',
    'Connection': 'keep-alive',
    'Mycon-Agent': 'wx_mp',
    'content-type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4MTkxMSIsImlhdCI6IjE2MzM4MjUzMTEiLCJuYmYiOiIxNjMzODI1MzExIiwiZXhwIjoiMTYzMzg1NDExMSIsImlzcyI6Ik5ldHNlcnZlckFQSSIsImF1ZCI6IlVzZXIiLCJuYW1laWQiOiI4MTkxMSIsInVzZXJJZCI6IjgxOTExIiwidXNlckluZm9JZCI6IjgxOTExIiwidXNlckFjY291bnQiOiLnlKjmiLc4MTkxMSIsInJvbGUiOiIwIn0.QkFzkP7ZMtGjxGwfJESfFkPlkVxRfWkI_q1_vaERblg',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip,compress,br,deflate',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.14(0x18000e2a) NetType/WIFI Language/zh_CN',
    'Referer': 'https://servicewechat.com/wxa8abc2aa9e0684e0/57/page-frame.html'
}

headers3 = {
    'Host': 'ad.paperone.com.cn:5001',
    'Connection': 'keep-alive',
    'Mycon-Agent': 'wx_mp',
    'content-type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NjIyIiwiaWF0IjoiMTYzMzgyNTMwMSIsIm5iZiI6IjE2MzM4MjUzMDEiLCJleHAiOiIxNjMzODU0MTAxIiwiaXNzIjoiTmV0c2VydmVyQVBJIiwiYXVkIjoiVXNlciIsIm5hbWVpZCI6Ijk2MjIiLCJ1c2VySWQiOiI5NjIyIiwidXNlckluZm9JZCI6Ijk2MjIiLCJ1c2VyQWNjb3VudCI6IueUqOaItzk2MjIiLCJyb2xlIjoiMCJ9.rKlnFoMJrI8riOzmoX7lcm3IbI3pxCGBHkE9hE8ow4I',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip,compress,br,deflate',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.14(0x18000e2a) NetType/WIFI Language/zh_CN',
    'Referer': 'https://servicewechat.com/wx4e7673de6249af1f/34/page-frame.html'

}
res = requests.get(url=url,headers=headers)
res1 = requests.get(url=url1,headers=headers1)
res2 = requests.get(url=url2,headers=headers2)
res3 = requests.get(url=url3,headers=headers3)

a = str(res.json()['msg'])
b = str(res1.json()['msg'])
c = str(res2.json()['msg'])
d = str(res3.json()['msg'])

print(a)
print(b)
print(c)
print(d)

e = a+ '\n' + b + '\n' + c + '\n' + d

url4 = 'https://api.day.app/fC842SsyD8qeqpFw2vp65S/亚太签到&分享/{}'.format(e)
requests.get(url=url4)
