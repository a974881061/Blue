import time
import requests

headers = {
    'Host': 'router-app-api.jdcloud.com',
    'jdmt-rx-sign': '20e4ea23808c24d76681eae465baac93',
    'Connection': 'keep-alive',
    'wskey': 'AAJhH44qAEDVHY46_Cn93F6vNnzxtkJydeY2zJzTMK11XRGyajtJzDoQlb5OcbSONdzffBa7cNDktiLaQBcme1atrAVlCWWy',
    'jdmt-rx-appKey': 'fe2c20725c261e49a80d707a6ab299e1',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': '%E4%BA%AC%E4%B8%9C%E4%BA%91%E6%97%A0%E7%BA%BF%E5%AE%9D/1015 CFNetwork/1327.0.4 Darwin/21.2.0'
}
#是否过期
def yz():
    global code
    url = 'https://router-app-api.jdcloud.com/v1/regions/cn-north-1/todayPointIncome?'
    res = requests.get(url=url,headers=headers)
    code = res.json()['code']

#今天积分
def today():
    global today_point,today_date
    url = 'https://router-app-api.jdcloud.com/v1/regions/cn-north-1/todayPointIncome?'
    res = requests.get(url=url,headers=headers)
    today_point = res.json()['result']['todayTotalPoint']
    today_date = res.json()['result']['todayDate']

#可兑换积分
def total():
    global totalAvailPoint
    url = 'https://router-app-api.jdcloud.com/v1/regions/cn-north-1/pinTotalAvailPoint?'
    res = requests.get(url=url,headers=headers)
    totalAvailPoint = res.json()['result']['totalAvailPoint']

#设备收入
def inward():
    global todayPointIncome0,allPointIncome0,todayPointIncome1,allPointIncome1
    url = 'https://router-app-api.jdcloud.com/v1/regions/cn-north-1/todayPointDetail?sortField=today_point&sortDirection=DESC&currentPage=1&pageSize=15'
    res = requests.get(url=url,headers=headers)
    todayPointIncome0 = res.json()['result']['pointInfos'][0]['todayPointIncome']
    allPointIncome0 = res.json()['result']['pointInfos'][0]['allPointIncome']
    todayPointIncome1 = res.json()['result']['pointInfos'][1]['todayPointIncome']
    allPointIncome1 = res.json()['result']['pointInfos'][1]['allPointIncome']

def main():
    yz()
    if code == 200:
        today()
        total()
        inward()
        notys = today_date + "\n" + "今日设备总积分收入：" + str(today_point) + '\n' + "可兑换积分：" + str(totalAvailPoint) + "\n" + "设备名(64+120G)" +  "今天积分收入:\t" + str(todayPointIncome0) + "\t总积分收入:\t" + str(allPointIncome0) + "\n" + "设备名(64)" + "今天积分收入:\t" + str(todayPointIncome1) + "\t总积分收入:\t" + str(allPointIncome1)
        url = 'https://api.day.app/fC842SsyD8qeqpFw2vp65S/京东云无线宝/{}'.format(notys)
        res = requests.get(url=url)
    else:
        url = 'https://api.day.app/fC842SsyD8qeqpFw2vp65S/京东云无线宝/账号过期，请更新账号'
        res = requests.get(url=url)

main()
