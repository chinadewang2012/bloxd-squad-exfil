#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用国内镜像下载GitHub文件
"""

import urllib.request
import ssl
import os

ssl._create_default_https_context = ssl._create_unverified_context

save_dir = "../新建文件夹"
os.makedirs(save_dir, exist_ok=True)

# 要下载的文件
files = ["API_REFERENCE.md", "CALLBACKS.md", "ENTITY_SETTINGS.md", 
         "BLOCK_NAMES.txt", "ITEM_NAMES.txt"]

# 国内镜像源列表
mirrors = [
    "https://ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/",
    "https://mirror.ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/",
    "https://github.moeyy.xyz/https://raw.githubusercontent.com/Bloxdy/code-api/main/",
]

print("=" * 60)
print("GitHub镜像爬虫")
print("=" * 60)

for filename in files:
    print(f"\n下载: {filename}")
    
    success = False
    for i, mirror in enumerate(mirrors):
        url = f"{mirror}{filename}"
        print(f"  尝试镜像 {i+1}/{len(mirrors)}...", end=" ")
        
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            request = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(request, timeout=20) as response:
                content = response.read()
            
            filepath = os.path.join(save_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(content)
            
            print(f"OK ({len(content):,} bytes)")
            success = True
            break
            
        except Exception as e:
            print(f"FAIL")
            continue
    
    if not success:
        print(f"  所有镜像都失败了")

print("\n" + "=" * 60)
print("下载完成")
print("=" * 60)
input("\n按回车键退出...")
