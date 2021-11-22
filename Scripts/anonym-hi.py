import requests

name = []
task_name = []
task_end_time = []
task_reward = []
surplus = []

url = 'https://app.anonym-hi.com/base/mobile/api/tasklist'
headers1 = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
    'Accept': '*/*',
    'deviceType': 'Unknown iPhone',
    'osType': 'iOS,15.000000',
    'Accept-Language': 'zh-Hans;q=1',
    'Accept-Encoding': 'gzip, deflate, br',
    'versionName': '2.3.6',
    'flag': '1',
    'deviceid': 'CE42CF85-B1F3-4E16-9A51-D03F7B8DE8A5',
    'versionCode': '9',
    'lang': 'zh_cn',
    'User-Agent': 'HDL/2.3.6 (iPhone; iOS 15.0.2; Scale/3.00)',
    'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZXZpY2VfaWQiOiJDRTQyQ0Y4NS1CMUYzLTRFMTYtOUE1MS1EMDNGN0I4REU4QTUiLCJ1c2VyX2ZsYWciOiJhcHAiLCJpZCI6IjMxYTcyNTkxNzE2OWQzZGY4NGMwZGQ1MDY3MmQwZTk0IiwiZXhwIjoxOTQ0MTc4NDkwLCJpYXQiOjE2Mjg4MTg0OTB9.ptppUf5sJq5tFie9AWUKQ2jl5jLH7iqa91tFE6UVvSo',
    'Content-Length': '126',
    'Cookie': 'SERVERID=e2671957e833428d9de7c9f28342dca4|1637573838|1637573833; acw_tc=2760779616375728236621390e30ce46ca4cbd8d54823b11b2149c3951d672',
    'sign': '7037537c408db0ea774883bdc346a986'
    }
headers2 = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
    'Accept': '*/*',
    'deviceType': 'Unknown iPhone',
    'osType': 'iOS,15.000000',
    'Accept-Language': 'zh-Hans;q=1',
    'Accept-Encoding': 'gzip, deflate, br',
    'versionName': '2.3.6',
    'flag': '1',
    'deviceid': 'CE42CF85-B1F3-4E16-9A51-D03F7B8DE8A5',
    'versionCode': '9',
    'lang': 'zh_cn',
    'User-Agent': 'HDL/2.3.6 (iPhone; iOS 15.0.2; Scale/3.00)',
    'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZXZpY2VfaWQiOiJDRTQyQ0Y4NS1CMUYzLTRFMTYtOUE1MS1EMDNGN0I4REU4QTUiLCJ1c2VyX2ZsYWciOiJhcHAiLCJpZCI6IjMxYTcyNTkxNzE2OWQzZGY4NGMwZGQ1MDY3MmQwZTk0IiwiZXhwIjoxOTQ0MTc4NDkwLCJpYXQiOjE2Mjg4MTg0OTB9.ptppUf5sJq5tFie9AWUKQ2jl5jLH7iqa91tFE6UVvSo',
    'Content-Length': '126',
    'Cookie': 'SERVERID=e2671957e833428d9de7c9f28342dca4|1637573838|1637573833; acw_tc=2760779616375728236621390e30ce46ca4cbd8d54823b11b2149c3951d672',
    'sign': 'd0b5789683533e7696beb0bea60f94d2'
    }

headers3 = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
    'Accept': '*/*',
    'deviceType': 'Unknown iPhone',
    'osType': 'iOS,15.000000',
    'Accept-Language': 'zh-Hans;q=1',
    'Accept-Encoding': 'gzip, deflate, br',
    'versionName': '2.3.6',
    'flag': '1',
    'deviceid': 'CE42CF85-B1F3-4E16-9A51-D03F7B8DE8A5',
    'versionCode': '9',
    'lang': 'zh_cn',
    'User-Agent': 'HDL/2.3.6 (iPhone; iOS 15.0.2; Scale/3.00)',
    'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZXZpY2VfaWQiOiJDRTQyQ0Y4NS1CMUYzLTRFMTYtOUE1MS1EMDNGN0I4REU4QTUiLCJ1c2VyX2ZsYWciOiJhcHAiLCJpZCI6IjMxYTcyNTkxNzE2OWQzZGY4NGMwZGQ1MDY3MmQwZTk0IiwiZXhwIjoxOTQ0MTc4NDkwLCJpYXQiOjE2Mjg4MTg0OTB9.ptppUf5sJq5tFie9AWUKQ2jl5jLH7iqa91tFE6UVvSo',
    'Content-Length': '126',
    'Cookie': 'SERVERID=e2671957e833428d9de7c9f28342dca4|1637573838|1637573833; acw_tc=2760779616375728236621390e30ce46ca4cbd8d54823b11b2149c3951d672',
    'sign': '6a63797fcb14a34deff563e1d76ec84f'
    }
body1 = '{"lnglat":"119.235546,26.087206","city":"350100","current":1,"country":"","tenant_id":"","size":10,"keyword":"","orderType":2}'
body2 = '{"lnglat":"119.235546,26.087206","city":"350100","current":2,"country":"","tenant_id":"","size":10,"keyword":"","orderType":2}'
body3 = '{"lnglat":"119.235546,26.087206","city":"350100","current":3,"country":"","tenant_id":"","size":10,"keyword":"","orderType":2}'
res1 = requests.post(url=url,headers=headers1,data=body1)
res2 = requests.post(url=url,headers=headers2,data=body2)
res3 = requests.post(url=url,headers=headers3,data=body3)

length = len(res1.json()['data']['records'])
for i in range(0,length):
    task_name.append(res1.json()['data']['records'][i]["task_name"])
    task_end_time.append(res1.json()['data']['records'][i]["task_end_time"])
    task_reward.append(res1.json()['data']['records'][i]["reward"])
    surplus.append(res1.json()['data']['records'][i]["surplus"])

length = len(res2.json()['data']['records'])
for i in range(0,length):
    task_name.append(res2.json()['data']['records'][i]["task_name"])
    task_end_time.append(res2.json()['data']['records'][i]["task_end_time"])
    task_reward.append(res2.json()['data']['records'][i]["reward"])
    surplus.append(res2.json()['data']['records'][i]["surplus"])



length = len(res3.json()['data']['records'])
for i in range(0,length):
    task_name.append(res3.json()['data']['records'][i]["task_name"])
    task_end_time.append(res2.json()['data']['records'][i]["task_end_time"])
    task_reward.append(res3.json()['data']['records'][i]["reward"])
    surplus.append(res3.json()['data']['records'][i]["surplus"])
    length1 = len(res3.json()['data']['records'][i]["items"])


#print(task_name)
#print(len(task_name))
#print(task_end_time)
#print(task_reward)
#print(name)
#print(surplus)
#print(res1.json())
#print(res2.json())
#print(res3.json())
for i in range(len(task_name)):
    if surplus[i] !=0 :
            notys = task_name[i] + "\n" + "任务结束时间为:" + task_end_time[i] + "\n" + "佣金为:" + str(task_reward[i]) + "\n"  + "余量：" + str(surplus[i])
            requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/洞见者/{}'.format(notys))
            requests.get(url='https://api.day.app/sEDEMqNYiSZb7iRQgdMwvj/洞见者/{}'.format(notys))
            requests.get(url='https://api.day.app/68DytnPi9EmrRGFvYCY3Pi/洞见者/{}'.format(notys))
            b =1
    else:
        b=0
if b==0:
    print("当前没有任务")
