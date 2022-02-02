import requests
import time

url = 'https://www.ttljf.com/ttl_site/giftApi.do?giftCategoryId=7&mthd=searchGift&pageNo=1&pageSize=10&sign=ba06bb1cc4ec3e6518e29ca17599b356'

res = requests.get(url=url).json()

num = len(res['gifts'])
giftName = []
price = []
count = []
for i in range(num):
    giftName.append(res['gifts'][i]['giftName'])
    price.append(res['gifts'][i]['price'])
    count.append(res['gifts'][i]['stockAmount'])


for i in range(num):
    if count[i] != 0:
        notys = str(giftName[i]) + "\n" + "所需积分为：" + str(price[i]) + "\n" + "当前余量为：" + str(count[i])
        requests.get(url='https://api.day.app/fC842SsyD8qeqpFw2vp65S/太太乐话费/{}'.format(notys))
        time.sleep(1)
    else:
        print("全部无货")

