#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple GitHub API Crawler
直接下载BloxD API文档
"""

import urllib.request
import ssl
import os

# 禁用SSL验证
ssl._create_default_https_context = ssl._create_unverified_context

# API文件列表
files = {
    "API_REFERENCE.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/API_REFERENCE.md",
    "CALLBACKS.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/CALLBACKS.md",
    "CLIENT_OPTIONS.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/CLIENT_OPTIONS.md",
    "ENTITY_SETTINGS.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/ENTITY_SETTINGS.md",
    "SKINS_AND_POSES.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/SKINS_AND_POSES.md",
    "SOUNDS_AND_MUSIC.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/SOUNDS_AND_MUSIC.md",
    "BLOCK_NAMES.txt": "https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt",
    "ITEM_NAMES.txt": "https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt",
    "README.md": "https://raw.githubusercontent.com/Bloxdy/code-api/main/README.md",
}

# 保存目录
save_dir = "../新建文件夹"
os.makedirs(save_dir, exist_ok=True)

print("=" * 60)
print("BloxD API 爬虫")
print("=" * 60)

success = 0
failed = []

for filename, url in files.items():
    print(f"\n下载: {filename}...", end=" ")
    
    try:
        # 设置请求头
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        request = urllib.request.Request(url, headers=headers)
        
        # 下载
        with urllib.request.urlopen(request, timeout=30) as response:
            content = response.read()
        
        # 保存
        filepath = os.path.join(save_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(content)
        
        size = len(content)
        print(f"OK ({size:,} bytes)")
        success += 1
        
    except Exception as e:
        print(f"FAIL: {str(e)[:50]}")
        failed.append(filename)

print("\n" + "=" * 60)
print(f"完成: 成功 {success}/{len(files)}")

if failed:
    print(f"\n失败的文件:")
    for f in failed:
        print(f"  - {f}")
    print("\n建议: 使用浏览器手动下载失败的文件")

print("=" * 60)
input("\n按回车键退出...")
