import requests

url = 'https://ai.cmbchina.com/mbwebservicesec/ModuleService.ashx?clientNo=&pageID=C8455BD9-8AD4-4B56-A193-22142C9EB3C1&moduleID=2983F705-72A0-42D7-9712-5B8023DD4E63&ModuleName=MetAccum&isLogin=&city=%E7%A6%8F%E5%B7%9E&cmblapiFlag=1&smFlag=1&randnum=0.2379998398243911'

headers = {
    'Content-Type': 'application/x-www-form-urlencoded;',
    'Cookie': 'WEBTRENDS_ID=117.136.75.152-2527433504.30913951::73E5F61D95F2DA7A78B6F4E908D',
    'Connection': 'keep-alive',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MPBank/10.1.3 iPhone/15.3.1 Scale/3.0 AID/R/1I5+VuDBfoOcyTUtR/J5/NwSw= SID/LHtjqxn3ZhAcERok8khfy12slL0= WebView/WKWebView DeviceType/D APPTag/1.0(N;47;fennudexiaoniaopink1;1.0;321) ',
    'Referer': 'https://ai.cmbchina.com/mb5web/metaldefault.html?version=10.1.3&DeviceType=D',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br'
}
try:
    res =requests.get(url=url,headers=headers).json()
    bidprice = str(res['accumMetPrc']['Msg'][1]['MetPrc'])
    sellprice = str(res['accumMetPrc']['Msg'][0]['MetPrc'])
    percent =  str(res['accumMetPrc']['Msg'][2]['MetPrc'])
    note = '当前买入价：' + bidprice + '\n' + '当前卖出价：' + sellprice + '\n' + '当前涨跌幅：' + percent + '%'
    requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/每日金价/{}?icon=https://raw.githubusercontent.com/a974881061/Blue/main/icons/gold.png'.format(note))
except:
    requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/每日金价/请求发送失败')
