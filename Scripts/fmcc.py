import json
import requests

H5_TOKEN = '446F2757AF027D57AA7F1C1491FDF292205323829A9C2A66DCD24B6F61CDED8BBF3FD4871640E8D2'
TaskId=[]

headers ={
        'Host': 'app.fmcc.com.cn',
        'Accept': 'application/json, text/plain, */*',
        'X-Tingyun':'c=B|0eimFYky29Y;x=7dc7d8623e66460b',
        'Accept-Encoding':'gzip, deflate, br',
        'Accept-Language':'zh-CN,zh-Hans;q=0.9',
        'Connection':'keep-alive',
        'H5_TOKEN':H5_TOKEN,
        'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;fj-bmsh;fontSizeScale1.00',
        'ms':'PZU2LBV22KLOWRUDUWJWEXCIXM',
        'Referer':'https://app.fmcc.com.cn/bass-bountyH5/home',
        'hc':'599',
        'Cookie':'sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22599500184154566%22%2C%22first_id%22%3A%2217fddc62d7dcc2-08a3daa2ccf0c28-7c7d2b14-329160-17fddc62d7e25b2%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfbG9naW5faWQiOiI1OTk1MDAxODQxNTQ1NjYiLCIkaWRlbnRpdHlfY29va2llX2lkIjoiMTdmZGRjNjJkN2RjYzItMDhhM2RhYTJjY2YwYzI4LTdjN2QyYjE0LTMyOTE2MC0xN2ZkZGM2MmQ3ZTI1YjIifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22599500184154566%22%7D%2C%22%24device_id%22%3A%2217fddc62d7dcc2-08a3daa2ccf0c28-7c7d2b14-329160-17fddc62d7e25b2%22%7D; H5_TOKEN=446F2757AF027D57AA7F1C1491FDF292FD50CE526897E2D9104DC1F3A23FE02D3C25F8262F77F825; hc=599; ms=PZU2LBV22KLOWRUDUWJWEXCIXM; uid=599500184154566; WT_FPC=id=23985e4934fdce6703f1648693352596:lv=1648693352596:ss=1648693352596; sajssdk_2015_cross_new_user=1'
    }

#资产获取
def getUserTotalInfo():
    url = 'https://app.fmcc.com.cn/bass-bonusServer/getUserTotalInfo'
    res = requests.get(url=url,headers=headers).json()
    if res['code'] == '0000':
        print('总奖励金为:{},当前奖励金为：{},已减排{}g,低碳{}天'.format(res['data']['bonusTotalNum'],res['data']['bonusLeftNum'],res['data']['carbonTotalNum'],res['data']['carbonDayCount']))


# 获取微信任务列表
def getWXBonusTask():
    global TaskId
    print("微信任务列表：")
    url = 'https://app.fmcc.com.cn/bass-bonusServer/getWtBonusPageTask'
    res = requests.get(url=url,headers=headers).json()
    if res['code'] == '0000':
        for i in range(len(res['data']['carbonTask']['subList'])):
            for j in range(len(res['data']['carbonTask']['subList'][i]['taskList'])):
                print(res['data']['carbonTask']['subList'][i]['taskList'][j]['mainTitle'] + '\t' +res['data']['carbonTask']['subList'][i]['taskList'][j]['id'])
                TaskId.append(res['data']['carbonTask']['subList'][i]['taskList'][j]['id'])
        for i in range(len(res['data']['commonTask']['taskList'])):
            print(res['data']['commonTask']['taskList'][i]['mainTitle'] + '\t' +res['data']['commonTask']['taskList'][i]['id'])
            TaskId.append(res['data']['commonTask']['taskList'][i]['id'])
    #print(res)
# 获取APP任务列表
def getAPPBonusTask():
    global TaskId
    print("APP任务列表：")
    url = 'https://app.fmcc.com.cn/bass-bonusServer/getBonusTask'
    res = requests.get(url=url,headers=headers).json()
    if res['code'] == '0000':
        for i in range(len(res['data']['carbonTask']['subList'])):
            for j in range(len(res['data']['carbonTask']['subList'][i]['taskList'])):
                print(res['data']['carbonTask']['subList'][i]['taskList'][j]['mainTitle'] + '\t' +res['data']['carbonTask']['subList'][i]['taskList'][j]['id'])
                TaskId.append(res['data']['carbonTask']['subList'][i]['taskList'][j]['id'])
        for i in range(len(res['data']['commonTask']['taskList'])):
            print(res['data']['commonTask']['taskList'][i]['mainTitle'] + '\t' +res['data']['commonTask']['taskList'][i]['id'])
            TaskId.append(res['data']['commonTask']['taskList'][i]['id'])

# 做任务
def finishTask():
    for i in range (len(TaskId)):
        url = 'https://app.fmcc.com.cn/bass-bonusServer/finishTask'
        headers = {
            'Host': 'app.fmcc.com.cn',
            'Accept': 'application/json, text/plain, */*',
            'X-Tingyun': 'c=B|0eimFYky29Y;x=d20ff410d3ff4b66',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Content-Type':'application/json;charset=utf-8',
            'Connection': 'keep-alive',
            'Origin':'https://app.fmcc.com.cn',
            'H5_TOKEN': H5_TOKEN,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;fj-bmsh;fontSizeScale1.00',
            'ms': 'PZU2LBV22KLOWRUDUWJWEXCIXM',
            'Content-Length':'79',
            'Referer': 'https://app.fmcc.com.cn/bass-bountyH5/main?pf=wt&ch=wtfwh_05',
            'hc': '599',
            'Cookie': 'sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22599500184154566%22%2C%22first_id%22%3A%2217fddc62d7dcc2-08a3daa2ccf0c28-7c7d2b14-329160-17fddc62d7e25b2%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfbG9naW5faWQiOiI1OTk1MDAxODQxNTQ1NjYiLCIkaWRlbnRpdHlfY29va2llX2lkIjoiMTdmZGRjNjJkN2RjYzItMDhhM2RhYTJjY2YwYzI4LTdjN2QyYjE0LTMyOTE2MC0xN2ZkZGM2MmQ3ZTI1YjIifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22599500184154566%22%7D%2C%22%24device_id%22%3A%2217fddc62d7dcc2-08a3daa2ccf0c28-7c7d2b14-329160-17fddc62d7e25b2%22%7D; H5_TOKEN=446F2757AF027D57AA7F1C1491FDF292FD50CE526897E2D9104DC1F3A23FE02D3C25F8262F77F825; hc=599; ms=PZU2LBV22KLOWRUDUWJWEXCIXM; uid=599500184154566; WT_FPC=id=23985e4934fdce6703f1648693352596:lv=1648693352596:ss=1648693352596; sajssdk_2015_cross_new_user=1'
        }
        data = {
            "clientVersion":"800",
            "taskId":TaskId[i]
        }
        res = requests.post(url=url,headers=headers,data=json.dumps(data))
        print(res.text)
getUserTotalInfo()
getAPPBonusTask()
getWXBonusTask()
finishTask()
