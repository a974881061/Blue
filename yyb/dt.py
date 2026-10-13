#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DT生活每日签到（yyb 多账号版）
青龙命令：task Blue/yyb/dt.py
账号与登录全部走 yyb-go，token 过期自动重登，无需手动抓 token。
"""
from yyb_core import run_app

if __name__ == "__main__":
    run_app("dt")
