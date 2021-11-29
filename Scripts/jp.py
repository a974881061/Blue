import requests
import datetime
import time

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

AliAccount = ["掉坑男_2013","bluegod233"]

data = str(year) + "%2F" + str(month) + "%2F" + str(day)
#print(data)
def IP():
    global resultdata
    #获取做单IP
    url = "http://103.249.111.62:8662/hapi//GetServerIP"


    res = requests.get(url=url,headers=headers)
    #print(res.json())
    resultdata = res.json()['resultdata']
    #print(resultdata)

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
    global BrusherAliAccount,date,task_num
    #任务信息
    try:
        url = "http://" + resultdata + "/GetTaskListNew?token=1374743&CurrentTabIndex=0&IsNoPic=0&ChangeDate="+data+"&SearchAccount=&nowPage=1&Status=0"
        res = requests.get(url=url,headers=headers)
        date = res.json()
        task_num = len(date['resultdata']['list'])
        print(res.json())
        if task_num !=0:
            for i in range(0,1):
                BrusherAliAccount = res.json()['resultdata']['list'][i]['BrusherAliAccount']
                NeedPayMoney = res.json()['resultdata']['list'][i]['NeedPayMoney']
                ShopName = res.json()['resultdata']['list'][i]['ShopName']
                CreateDate = res.json()['resultdata']['list'][i]['CreateDate']
                Status = res.json()['resultdata']['list'][i]['Status']
                RelationId = res.json()['resultdata']['list'][i]['RelationId']
                ticks = time.time()
                timeArray = time.strptime(CreateDate, "%Y-%m-%d %H:%M:%S")
                if Status != "OK":
                    url1 = "http://" + resultdata + "/GetOrder?RelationId="+RelationId+"&token=1374743"
                    res2 = requests.get(url=url1,headers=headers)
                    print(res2.json())
                if Status != "OK" and ticks > time.mktime(timeArray):
                    GoodLink = res2.json()['resultdata'][0]['task']['GoodLink']
                    notys = "做单账号为：" + str(BrusherAliAccount) + "\n" + "任务金额为:" + str(NeedPayMoney) + "\n" + "店铺名称为:" + str(ShopName) + "\n" + "任务开始时间：" + str(CreateDate)
                    requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/精品平台/{}'.format(notys))
                    requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/TBURL?url={}'.format(GoodLink))
    except:
        task_num =0
        print("没有任务")

def get_task():
    url0 = "http://" + resultdata + "//GetOrder?token=1374743&Aliww=%E6%8E%89%E5%9D%91%E7%94%B7_2013"
    url1 = "http://" + resultdata + "//GetOrder?token=1374743&Aliww=bluegod233"
    if task_num == 0:
        res1 = requests.get(url=url1,headers=headers)
        res2 = requests.get(url=url0, headers=headers)
        print(res1.json())
        print(res2.json())
    elif task_num == 1:
        for i in range(0,1):
            if date['resultdata']['list'][i]['BrusherAliAccount'] == AliAccount[1]:
                res1 = requests.get(url=url1,headers=headers)
                print(res1.json())
            else:
                res2 = requests.get(url=url0, headers=headers)
                print(res2.json())



def main():
    IP()
    user()
    task()
    if task_num != 2:
        get_task()
    else:
        print("所有账号都接到任务啦")

main()


