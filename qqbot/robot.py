from flask import Flask, request
#from bs4 import BeautifulSoup
from urllib import parse
import requests
#import pymysql
import time
import json
import re
import os

'''这是导入的另一个文件，下面会讲到'''
app = Flask(__name__)
url = 'http://127.0.0.1:5000/'
price_url = 'http://www.qianggou5.com/price/'
match = '"/buy/\d/.*?/".*\d+-\d+.\d+:\d+'
#price = ['&#xe771','&#xeb39','&#xe63b','&#xeeaa','&#xedab','&#xef15','&#xe86a','&#xe200','&#xe5c5','&#xe000']

# conn = pymysql.connect(
#     host='localhost',
#     user='root',
#     password='a123456',
#     db='phone_price',
#     charset='utf8',
#     autocommit=True,    # 如果插入数据，， 是否自动提交? 和conn.commit()功能一致。
# )
# #创建游标对象
# cur = conn.cursor()

class API:
    @staticmethod
    #加好友请求处理
    def set_friend_add_request(flag):
        send_url= url + 'set_friend_add_request'
        params = {
            "flag":flag,
            "approve": "true"
        }
        requests.get(send_url,params=params)

    #加群请求处理
    def set_group_add_request(self,flag,sub_type):
        send_url = url + 'set_group_add_request'
        params = {
            "flag":flag,
            "approve":"true",
            "sub_type":sub_type
        }
        requests.get(send_url,params=params)

    #私聊消息处理
    def send_private_msg(self,user_id,message):
        send_url = url + "send_private_msg"
        params = {
            "user_id": user_id,
            "message": message
        }
        requests.get(send_url, params=params)

    #发送私聊图片
    def send_private_img(self,user_id,file):
        send_url = url + "send_private_msg"
        params = {
            "user_id": user_id,
            "message": f'[CQ:image,file={file}]'
        }
        requests.get(send_url,params=params)


    #群聊消息处理
    def send_group_msg(self,group_id,message):
        send_url = url + "send_group_msg"
        params = {
            "group_id": group_id,
            "message": message
        }
        requests.get(send_url,params=params)

    # 发送群聊图片
    def send_group_img(self,group_id,file):
        send_url = url + "send_group_msg"
        params = {
            "group_id": group_id,
            "message": f'[CQ:image,file={file}]'
        }
        requests.get(send_url, params=params)


    #宿舍查寝处理
    def send_dormitory_report(self,group_id):
        send_url = url + "send_group_msg"
        params = {
            "group_id": group_id,
            "message": '''宿舍：南4 630
宿舍人数：8
返校人数：7
已回宿舍人数：7
郭伟捷未返校'''
        }
        requests.get(send_url,params=params)

    # #查询手机价格
    # def serch_price(self,name):
    #     try:
    #         select_date = "select date from date where name = {};".format('"' + name + '"')
    #         cur.execute(select_date)
    #         return cur.fetchall()[0][0]
    #     except:
    #         return 0
    #
    # #更新手机价格
    # def update_price(self,name, date):
    #     try:
    #         update_date = "UPDATE date set date = {} WHERE name = {}".format('"' + date + '"', '"' + name + '"')
    #         cur.execute(update_date)
    #     except:
    #         return 0
    #     else:
    #         return 1
    #
    # #发送手机报价
    # def send_phone_price(self,name,user_id):
    #     serch_result = self.serch_price(name)
    #     if serch_result == 0:
    #         self.send_private_msg(user_id,"没有该机型")
    #     else:
    #         res = requests.get(url=price_url).text
    #         result = re.findall(match, res)
    #         for i in range(len(result)):
    #             new_name = result[i].split('/')[3]
    #             new_date = result[i].split('更新于')[1]
    #             if name.lower() == new_name.lower():
    #                 if serch_result != new_date:
    #                     update_result = self.update_price(new_name, new_date)
    #                     if update_result == 1:
    #                         print("更新成功")
    #                 self.send_private_msg(user_id, "更新时间为："+new_date)


    #历史价格
    def history_price(self,product_url):
        url = 'https://apapia-history.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx'

        headers = {"Cookie": "jjkcpnew111=cp32641711_6113196153_2021/11/1",
                   "Accept": "*/*",
                   "Accept-Encoding": "gzip, deflate",
                   "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
                   "Connection": "keep-alive",
                   "Host": "apapia-history.manmanbuy.com",
                   "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 - mmbWebBrowse - ios",
                   "Accept-Language": "en-us"
                   }

        body = 'methodName=getHistoryTrend&p_url=' + parse.quote(product_url)

        res = requests.post(url=url, headers=headers, data=body).json()
        if res['ok'] == 1:
            price = '商品：{}\n历史最低到手价: {}({})\n{}\n当前到手价  {}  {}  {}\n历史最低价  {}  {}  {}\n六一八价格  {}  {}  {}\n双十一价格  {}  {}  {}\n三十天价格  {}  {}  {}\n九十天价格  {}  {}  {}'.format(
                res['single']['title'],
                res['haojialist'][0]['extraPrice'], res['haojialist'][0]['discountData'],
                res['PriceRemark']['CurrentPriceStatus'], res['PriceRemark']['ListPriceDetail'][0]['Price'],
                res['PriceRemark']['ListPriceDetail'][0]['Date'],
                res['PriceRemark']['ListPriceDetail'][0]['Difference'],
                res['PriceRemark']['ListPriceDetail'][1]['Price'], res['PriceRemark']['ListPriceDetail'][1]['Date'],
                res['PriceRemark']['ListPriceDetail'][1]['Difference'],
                res['PriceRemark']['ListPriceDetail'][2]['Price'], res['PriceRemark']['ListPriceDetail'][2]['Date'],
                res['PriceRemark']['ListPriceDetail'][2]['Difference'],
                res['PriceRemark']['ListPriceDetail'][3]['Price'], res['PriceRemark']['ListPriceDetail'][3]['Date'],
                res['PriceRemark']['ListPriceDetail'][3]['Difference'],
                res['PriceRemark']['ListPriceDetail'][4]['Price'], res['PriceRemark']['ListPriceDetail'][4]['Date'],
                res['PriceRemark']['ListPriceDetail'][4]['Difference'],
                res['PriceRemark']['ListPriceDetail'][6]['Price'], res['PriceRemark']['ListPriceDetail'][6]['Date'],
                res['PriceRemark']['ListPriceDetail'][6]['Difference'])

            return price
        elif res['ok'] == 0:
            price = res['msg']
            return price

    def jdfl(self,jdck,jdurl):
        headers = {
            'Host': 'api.m.jd.com',
            'Connection': 'keep-alive',
            'Cookie': jdck,
            'content-type': 'application/json',
            'Accept-Encoding': 'gzip,compress,br,deflate',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.29(0x18001d35) NetType/4G Language/zh_CN',
            'Referer': 'https://servicewechat.com/wxf463e50cd384beda/144/page-frame.html'
        }
        base_url = 'https://api.m.jd.com/api?'
        payload = {
            'functionId': 'ConvertSuperLink',
            'appid': 'u',
            '_': str(int(time.time())),
            'body': json.dumps(
                {'funName': 'getSuperClickUrl',
                 'param': {
                     'materialInfo': str(jdurl),
                     'ext1': '200|100_3|',
                 },
                 'unionId': '1000150533',
                 }
            ),
            'loginType': '2'
        }
        res = requests.get(url=base_url, headers=headers, params=payload).json()
        if res['code'] == 200:
            print(res)
            if 'skuName' in res['data']:
                price = self.history_price(product_url=jdurl)
                message = "{}\n领券购买：{}".format(price,res['data']['promotionUrl'])
            else:
                message = res['data']['originalContext']
        elif res['code'] == 105:
            price = self.history_price(product_url=jdurl)
            print(res)
            message = "{}\n领券购买：{}".format(price,jdurl)
        return message

    def qq_serch(self,qq):
        url = 'https://api.lsrnb.com/lsrapi/qs/?qq=' + str(qq)
        res = requests.get(url).json()
        if res['status'] ==200:
            result = '{}\n手机号:{}({})\nlolid:{}\n微博号:{}'.format(res['message'],res['phone'],res['phonediqu'],res['lol'],res['wb'])
            return result
        elif res['status'] ==500:
            result = res['message']
            return result
        else:
            return "查询失败"

    def xhs(self,xhs_code,id,type):
        base_url = 'https:'
        panda_url = 'https://dlpanda.com/zh-CN/xhs?url='
        xhs_url = panda_url + parse.quote(xhs_code).replace('/','%2F')
        user_path = 'xhs/' + str(id)
        if os.path.exists(user_path) == True:
            pass
        else:
            os.makedirs(user_path)
        res = requests.get(url=xhs_url,timeout=5).text
        match = '//safe-img.xhscdn.com/bw1/.*?jpg'
        match1 = '//ci.xiaohongshu.com.*/jpg'
        xhs_result = re.findall(match, res)
        xhs_result1 = re.findall(match1, res)
        if len(xhs_result) != 0:
            for i in range(len(xhs_result)):
                jgp_url = base_url + xhs_result[i]
                img_name = jgp_url.split('/')[4].split('?')[0] + '.jpg'
                img = requests.get(jgp_url).content
                img_path = f'xhs/{id}/{img_name}'
                if os.path.exists(img_path) == True:
                    print(img_name + "文件存在")
                else:
                    with open(f'xhs/{id}/{img_name}', "wb") as f:
                        f.write(img)
                    if type == 1:
                        self.send_private_img(user_id=id,file=jgp_url)
                    elif type == 2:
                        self.send_group_img(group_id=id,file=jgp_url)
        elif len(xhs_result1) != 0:
            for i in range(len(xhs_result1)):
                jgp_url = base_url + xhs_result1[i]
                img_name = jgp_url.split('/')[3].split('?')[0] + '.jpg'
                img = requests.get(jgp_url).content
                img_path = f'xhs/{id}/{img_name}'
                if os.path.exists(img_path) == True:
                    print(img_name + "文件存在")
                else:
                    with open(f'xhs/{id}/{img_name}', "wb") as f:
                        f.write(img)
                    if type == 1:
                        self.send_private_img(user_id=id,file=jgp_url)
                    elif type == 2:
                        self.send_group_img(group_id=id,file=jgp_url)


@app.route('/', methods=["POST"])
def post_data():
    """下面的request.get_json().get......是用来获取关键字的值用的，关键字参考上面代码段的数据格式"""
    data = request.get_json()
    if data['post_type'] != 'meta_event':
        #print(data)
        #如果是消息类
        if data['post_type'] == 'message':
            #如果是私聊消息
            if data["message_type"] == 'private':
                print(data)
                message = data['message']
                user_id = data['user_id']
                #ck更新
                ck_result = re.findall(r'pt_key=.*?;pt_pin=.*?;',message)
                if ck_result != []:
                    ck = ck_result[0]
                    try:
                        with open('jdck.txt','w',encoding='utf-8') as f:
                            f.writelines(ck)
                            f.close()
                            API().send_private_msg(user_id=user_id, message='写入成功')
                    except Exception as r:
                        API().send_private_msg(user_id=user_id,message='写入失败'+str(r))

                #qq信息查询
                qq_result = re.findall("qq查询.*",message)
                if qq_result != []:
                    qq = qq_result[0].split(" ")[1]
                    qq_meg = API().qq_serch(qq)
                    API().send_private_msg(user_id=user_id,message=qq_meg)
                #手机报价
                result = re.findall("手机报价.*",message)
                if result != []:
                    name = result[0].split(' ')[1]
                    if name == 'airpods':
                        name =''
                    API().send_phone_price(name=name,user_id=user_id)

                #tbfl
                tb_result = re.findall('tb.cn',message)
                if tb_result !=[]:
                    tb_url = re.findall(r'https://.*?\n',message)[0]
                    tb_meg = API().history_price(product_url=tb_url)
                    API().send_private_msg(user_id=user_id,message=tb_meg)

                #pddfl
                pdd_result = re.findall('yangkeduo.com',message)
                if pdd_result !=[]:
                    if message[1:3] =='CQ':
                        match = 'https:.*?goods_id=\d+'
                        pdd_cq_result =re.findall(match,message)[0]
                        if "\\" in message:
                            pdd_url = pdd_cq_result.replace("\\",'')
                            pdd_meg = API().history_price(product_url=pdd_url)
                            API().send_private_msg(user_id=user_id, message=pdd_meg)
                        else:
                            pdd_meg = API().history_price(product_url=pdd_cq_result)
                            API().send_private_msg(user_id=user_id, message=pdd_meg)
                    else:
                        pdd_url = re.findall(r'https://mobile.*?goods_id=\d+',message)[0]
                        pdd_meg = API().history_price(product_url=pdd_url)
                        API().send_private_msg(user_id=user_id,message=pdd_meg)
                #jdfl
                result = re.findall('jd.com',message)
                if result !=[]:
                    url_result = re.findall('u.jd.com',message)
                    if url_result != [] and user_id == 974881061:
                        with open('jdck.txt', encoding='utf-8') as f:
                            jdck = f.readline()
                        fl_url = API().jdfl(jdck=jdck,jdurl=message)
                        API().send_group_msg(group_id=910025366,message=fl_url)
                    else:
                        with open('jdck.txt',encoding='utf-8') as f:
                            jdck = f.readline()
                        if message[1:3] == 'CQ':
                            match = 'http.*?html'
                            result = re.findall(match,message)
                            if result != []:
                                print(result)
                                message = result[0]
                                print(message)
                                if "\\" in message:
                                    jdurl = message.replace("\\",'')
                                    print(jdurl)
                                    fl_url = API().jdfl(jdck=jdck,jdurl=jdurl)
                                    API().send_private_msg(user_id=user_id,message=fl_url)
                                else:
                                    fl_url = API().jdfl(jdck=jdck,jdurl=message)
                                    API().send_private_msg(user_id=user_id, message=fl_url)

                        else:
                            fl_url = API().jdfl(jdck=jdck,jdurl=message)
                            API().send_private_msg(user_id=user_id, message=fl_url)
                #xhs
                result = re.findall(r'http://xhslink.com/\w+',message)
                if result != []:
                    API().xhs(xhs_code=result[0],id=user_id,type=1)
                result = re.findall(r'www.xiaohongshu.com',message)
                if result !=[]:
                    xhs_url = re.findall(r'https:.*?\?',message)[0]
                    if "\\" in xhs_url:
                        result =xhs_url.replace("\\",'')
                        API().xhs(xhs_code=result,id=user_id,type=1)
                    else:
                        API().xhs(xhs_code=xhs_url,id=user_id,type=1)



            #如果是群聊消息
            elif data['message_type'] == 'group':
                group_id = data['group_id']
                message = data['message']
                result = re.findall("辛苦各位舍长反馈今晚的宿舍情况", message)
                if result != []:
                    API().send_dormitory_report(group_id=group_id)
                #京东返利
                if group_id == 740907233:
                    pass
                else:
                    #tbfl
                    result = re.findall('tb.cn', message)
                    if result != []:
                        product_url = re.findall(r'https://.*?\n', message)[0]
                        fl_meg = API().history_price(product_url=product_url)
                        API().send_group_msg(group_id=group_id, message=fl_meg)
                    #pddfl
                    pdd_result = re.findall('yangkeduo.com', message)
                    if pdd_result != []:
                        if message[1:3] == 'CQ':
                            match = 'https:.*?goods_id=\d+'
                            pdd_cq_result = re.findall(match, message)[0]
                            if "\\" in message:
                                pdd_url = pdd_cq_result.replace("\\", '')
                                pdd_meg = API().history_price(product_url=pdd_url)
                                API().send_group_msg(group_id=group_id, message=pdd_meg)
                            else:
                                pdd_meg = API().history_price(product_url=pdd_cq_result)
                                API().send_group_msg(group_id=group_id,message=pdd_meg)
                        else:
                            pdd_url = re.findall(r'https://mobile.*?goods_id=\d+', message)[0]
                            pdd_meg = API().history_price(product_url=pdd_url)
                            API().send_group_msg(group_id=group_id, message=pdd_meg)


                    result = re.findall('jd.com',message)
                    if result !=[]:
                        with open('jdck.txt',encoding='utf-8') as f:
                            jdck = f.readline()
                        if message[1:3] == 'CQ':
                            match = 'http.*?html'
                            result = re.findall(match,message)
                            if result != []:
                                message = result[0]
                                print(message)
                                if "\\" in message:
                                    jdurl = message.replace("\\",'')
                                    print("商品链接"+jdurl)
                                    fl_url = API().jdfl(jdck=jdck,jdurl=jdurl)
                                    API().send_group_msg(group_id=group_id, message=fl_url)
                                else:
                                    fl_url = API().jdfl(jdck=jdck, jdurl=message)
                                    API().send_group_msg(group_id=group_id, message=fl_url)
                        else:
                            fl_message = API().jdfl(jdck=jdck,jdurl=message)
                            API().send_group_msg(group_id=group_id, message=fl_message)
                    # xhs
                    result = re.findall(r'http://xhslink.com/\w+', message)
                    if result != []:
                        API().xhs(xhs_code=result[0], id=group_id, type=1)
                    result = re.findall(r'www.xiaohongshu.com', message)
                    if result != []:
                        xhs_url = re.findall(r'https:.*?\?', message)[0]
                        if "\\" in xhs_url:
                            result = xhs_url.replace("\\", '')
                            API().xhs(xhs_code=result, id=group_id, type=2)
                        else:
                            API().xhs(xhs_code=xhs_url, id=group_id, type=2)

        #如果是请求类
        elif data['post_type'] == 'request':
            print(data)
            flag = data['flag']
            #如果是加群消息
            if data['request_type'] == 'group':
                sub_type = data['sub_type']
                API().set_group_add_request(sub_type=sub_type,flag=flag)
            #如果是加好友消息
            else:
                API().set_friend_add_request(flag=flag)


    return "OK"


if __name__ == '__main__':
    # 此处的 host和 port对应上面 yml文件的设置
    app.run(host='0.0.0.0', port=5001)  # 保证和我们在配置里填的一致
