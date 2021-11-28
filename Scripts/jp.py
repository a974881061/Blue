import requests
import datetime

headers = {
    'Host': '103.249.111.62:8662',
    'Connection': 'keep-alive',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Mobile Safari/537.36',
    'Origin': 'http://bbgg.bfxlonely.com:9660',
    'Referer': 'http://bbgg.bfxlonely.com:9660/',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

year = datetime.datetime.now().year
month = datetime.datetime.now().month
day = datetime.datetime.now().day

time = str(year) + "%2F" + str(month) + "%2F" + str(day)

def IP():
    global resultdata
    #获取做单IP
    url = "http://103.249.111.62:8662/hapi//GetServerIP"


    res = requests.get(url=url,headers=headers)
    print(res.json())
    resultdata = res.json()['resultdata']
    print(resultdata)

def user():
    # 账户信息
    url = "http://" + resultdata + "/GetBrusherInfoNew?token=1374743"
    res = requests.get(url=url,headers=headers)
    #print(res.json())
    JFCount = res.json()["resultdata"]["JFCount"]
    CreditMoney = res.json()["resultdata"]["CreditMoney"]
    print("账号积分为：" + str(JFCount))
    print("账号余额为：" + str(CreditMoney))

def task():
    #任务信息
    url = "http://" + resultdata + "/GetTaskListNew?token=1374743&CurrentTabIndex=0&IsNoPic=0&ChangeDate="+time+"&SearchAccount=&nowPage=1&Status=0"
    res = requests.get(url=url,headers=headers)
    print(res.json())
    BrusherAliAccount = res.json()['resultdata']['list'][0]['BrusherAliAccount']
    NeedPayMoney = res.json()['resultdata']['list'][0]['NeedPayMoney']
    ShopName = res.json()['resultdata']['list'][0]['ShopName']
    CreateDate = res.json()['resultdata']['list'][0]['CreateDate']
    Status = res.json()['resultdata']['list'][0]['Status']
    notys = "做单账号为：" + str(BrusherAliAccount) + "\n" + "任务金额为:" + str(NeedPayMoney) + "\n" + "店铺名称为:" + str(ShopName) + "\n"  + "任务开始时间：" + str(CreateDate)
    if Status != "OK":
        requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/精品平台/{}'.format(notys))

def get_task():
    url = "http://" + resultdata + "//GetOrder?token=1374743&Aliww=%E6%8E%89%E5%9D%91%E7%94%B7_2013"
    url1 = "http://" + resultdata + "//GetOrder?token=1374743&Aliww=bluegod233"
    res = requests.get(url=url,headers=headers)
    print(res.json())

def main():
    IP()
    user()
    task()
    get_task()

main()


