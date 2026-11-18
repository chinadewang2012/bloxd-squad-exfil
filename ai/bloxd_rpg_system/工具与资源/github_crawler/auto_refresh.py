#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动刷新BloxD API文档
定期检查GitHub更新并自动下载最新版本
"""

import os
import json
import time
import hashlib
import urllib.request
import ssl
from datetime import datetime
from pathlib import Path

# 禁用SSL验证
ssl._create_default_https_context = ssl._create_unverified_context

# API文档列表
API_FILES = {
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
SAVE_DIR = Path("../新建文件夹")
SAVE_DIR.mkdir(exist_ok=True)

# 版本记录文件
VERSION_FILE = Path("api_versions.json")


def get_file_hash(content):
    """计算文件内容的哈希值"""
    return hashlib.md5(content).hexdigest()


def load_versions():
    """加载版本记录"""
    if VERSION_FILE.exists():
        try:
            with open(VERSION_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_versions(versions):
    """保存版本记录"""
    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(versions, f, indent=2, ensure_ascii=False)


def download_file(url, timeout=60):
    """下载文件内容"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        request = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except Exception as e:
        print(f"  ✗ 下载失败: {e}")
        return None


def check_and_update():
    """检查并更新文件"""
    print("=" * 60)
    print(f"自动刷新API文档 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    versions = load_versions()
    updated = []
    failed = []
    unchanged = []
    
    for filename, url in API_FILES.items():
        print(f"\n检查: {filename}")
        
        # 下载最新内容
        content = download_file(url)
        if content is None:
            failed.append(filename)
            continue
        
        # 计算新版本的哈希
        new_hash = get_file_hash(content)
        old_hash = versions.get(filename, {}).get('hash', '')
        
        # 比较版本
        if new_hash == old_hash:
            print(f"  ✓ 已是最新版本")
            unchanged.append(filename)
            continue
        
        # 保存新版本
        filepath = SAVE_DIR / filename
        try:
            with open(filepath, 'wb') as f:
                f.write(content)
            
            # 更新版本记录
            versions[filename] = {
                'hash': new_hash,
                'updated_at': datetime.now().isoformat(),
                'size': len(content)
            }
            
            print(f"  ✓ 已更新 ({len(content):,} bytes)")
            updated.append(filename)
            
        except Exception as e:
            print(f"  ✗ 保存失败: {e}")
            failed.append(filename)
    
    # 保存版本记录
    save_versions(versions)
    
    # 打印总结
    print("\n" + "=" * 60)
    print("刷新完成!")
    print("=" * 60)
    print(f"\n更新: {len(updated)} 个文件")
    if updated:
        for f in updated:
            print(f"  ✓ {f}")
    
    print(f"\n未变化: {len(unchanged)} 个文件")
    
    if failed:
        print(f"\n失败: {len(failed)} 个文件")
        for f in failed:
            print(f"  ✗ {f}")
    
    return len(updated)


def run_scheduled(interval_minutes=60):
    """定时运行刷新"""
    print(f"\n启动定时刷新服务 (每 {interval_minutes} 分钟检查一次)")
    print("按 Ctrl+C 停止\n")
    
    try:
        while True:
            updated = check_and_update()
            
            if updated > 0:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 已更新 {updated} 个文件")
            else:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 无更新")
            
            print(f"\n下次检查: {interval_minutes} 分钟后...")
            time.sleep(interval_minutes * 60)
            
    except KeyboardInterrupt:
        print("\n\n定时服务已停止")


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='自动刷新BloxD API文档')
    parser.add_argument('--once', action='store_true', help='只执行一次')
    parser.add_argument('--interval', type=int, default=60, help='检查间隔(分钟)')
    
    args = parser.parse_args()
    
    if args.once:
        check_and_update()
    else:
        run_scheduled(args.interval)


if __name__ == "__main__":
    main()
