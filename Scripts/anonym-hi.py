import requests

name = []
task_name = []
task_reward = []
task_endtime = []
items_num = []
restaurant_name = []
surplus = []
distance = []
t=0
url = "https://app.anonym-hi.com/base/mobile/api/tasklist"
headers = {
    'Host': 'app.anonym-hi.com',
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
    'Accept': '*/*',
    'deviceType': 'iPhone XR',
    'osType': 'iOS,15.000000',
    'Accept-Language': 'zh-Hans;q=1',
    'Accept-Encoding': 'gzip, deflate, br',
    'versionName': '2.3.5',
    'flag': '1',
    'deviceid': 'CE42CF85-B1F3-4E16-9A51-D03F7B8DE8A5',
    'versionCode': '8',
    'lang': 'zh_cn',
    'User-Agent': 'HDL/2.3.5 (iPhone; iOS 15.0; Scale/2.00)',
    'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZXZpY2VfaWQiOiJDRTQyQ0Y4NS1CMUYzLTRFMTYtOUE1MS1EMDNGN0I4REU4QTUiLCJ1c2VyX2ZsYWciOiJhcHAiLCJpZCI6IjMxYTcyNTkxNzE2OWQzZGY4NGMwZGQ1MDY3MmQwZTk0IiwiZXhwIjoxOTQ0MTc4NDkwLCJpYXQiOjE2Mjg4MTg0OTB9.ptppUf5sJq5tFie9AWUKQ2jl5jLH7iqa91tFE6UVvSo',
    'Content-Length': '126',
    'Cookie': 'SERVERID=630cfaa8356c30a634cc84312ee0f57e|1634399882|1634399763; acw_tc=2760776616343997635244856ea7a73f979717b3d3b24a2a916aeb238699ab',
    'sign': 'e0aee97b6bc92241e45771d5e2484a96'
}
data = '{"lnglat":"119.235562,26.087221","city":"350100","current":1,"country":"","tenant_id":"","size":10,"keyword":"","orderType":2}'

res = requests.post(url=url,headers=headers,data=data)
#print(res.json())
task = res.json()['data']['records']
task_num = len(res.json()['data']['records'])
#print(res.json()['data']['records'][2])
#print(task_num)
for i in range(0,task_num):
    task_name.append(task[i]['task_name'])
    task_reward.append(task[i]['reward'])
    task_endtime.append(task[i]['task_end_time'])
    items = task[i]['items']
    items_num.append(len(task[i]['items']))
    for j in range(0,len(task[i]['items'])):
        restaurant_name.append(items[j]['restaurant_name'])
        surplus.append(items[j]['surplus'])
        distance.append(items[j]['distance'])

#print(task_name)
#print(task_reward)
#print(task_endtime)
#print(items_num)
#print(restaurant_name)
#print(surplus)
noty = len(surplus)
#print(noty)
#print(distance)
for i in range(noty):
    if surplus[i] !=0 and distance[i] < 15000:
        notys = restaurant_name[i] + "\n" + "余量：" + str(surplus[i])
        requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/洞见者/{}'.format(notys))
    else:
        t+=1
if t == noty:
    print("当前没有任务")
