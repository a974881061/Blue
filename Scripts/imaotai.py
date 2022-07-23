import requests

url = 'https://h5.moutai519.com.cn/xhr/front/mall/item/purchaseInfo'

headers = {"Host":"h5.moutai519.com.cn","Connection":"keep-alive","Accept":"n/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest","Accept-Language":"zh-CN,zh-Hans;q=0.9","Accept-Encoding":"gzip, deflate, br","Content-Type":"application/json","Origin":"https://fe.moutai519.com.cn","MT-APP-Version":"1.2.3","User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 moutaiapp/1.2.9 device-id/e81c08bad988361da345e3c75a6c7d27","Referer":"https://fe.moutai519.com.cn/","Content-Length":"591","x-csrf-token":"","MT-BIZID":"mt.shop.app.sale","Cookie":"MT-Device-ID-Wap=DAAC1F96-9A2B-4B7B-AF12-7CB0E55C0918; MT-Token-Wap=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJtdCIsImV4cCI6MTY1OTQwNTUzMywidXNlcklkIjoxMDYzMDg4NTAzLCJkZXZpY2VJZCI6IkRBQUMxRjk2LTlBMkItNEI3Qi1BRjEyLTdDQjBFNTVDMDkxOCIsImlhdCI6MTY1NjgxMzUzM30.Cxe1mxkkjKh3qm1G8gl7noPAzY9_tQGsc6QieB12dvs"}

body = '{"hot":"true","itemCode":"10193","province":"350000000","city":"350100000","district":"350104000","jt":"anonymous"}'

res = requests.post(url=url,headers=headers,data=body).json()

if res['data']['purchaseInfo']['limitCount'] != 0:
    url = 'https://api.day.app/fC842SsyD8qeqpFw2vp65S/I茅台/当前余量为:{}?icon=https://raw.githubusercontent.com/a974881061/Blue/main/icons/imaotai.jpg'.format(res['data'])
    requests.get(url=url)
