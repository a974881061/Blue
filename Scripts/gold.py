import requests

url = 'https://ai.cmbchina.com/mbwebservicesec/ModuleService.ashx?clientNo=&pageID=C8455BD9-8AD4-4B56-A193-22142C9EB3C1&moduleID=2983F705-72A0-42D7-9712-5B8023DD4E63&ModuleName=MetAccum&isLogin=&city=%E7%A6%8F%E5%B7%9E&cmblapiFlag=1&smFlag=1&randnum=0.2379998398243911'

res = requests.get(url=url).json()

bidprice = str(res['accumMetPrc']['Msg'][1]['MetPrc'])
sellprice = str(res['accumMetPrc']['Msg'][0]['MetPrc'])
percent =  str(res['accumMetPrc']['Msg'][2]['MetPrc'])
note = '当前买入价：' + bidprice + '\n' + '当前卖出价：' + sellprice + '\n' + '当前涨跌幅：' + percent + '%'
requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/每日金价/{}?icon=https://raw.githubusercontent.com/a974881061/Blue/main/icons/gold.png'.format(note))
