"""
========================================
GitHub 代码库定期爬取工具
========================================
功能：定期爬取GitHub公开代码库并保存到本地
支持：定时任务、增量更新、错误重试、日志记录
"""

import os
import sys
import json
import time
import logging
import zipfile
import requests
import schedule
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse


class GitHubCrawler:
    """GitHub代码库爬取器"""
    
    def __init__(self, config_path="crawler_config.json"):
        """
        初始化爬虫
        :param config_path: 配置文件路径
        """
        self.config_path = config_path
        self.config = self.load_config()
        self.setup_logging()
        self.session = requests.Session()
        
        # 设置请求头
        self.session.headers.update({
            'User-Agent': 'GitHub-Crawler/1.0',
            'Accept': 'application/vnd.github.v3+json'
        })
        
        # 如果有GitHub Token，添加到请求头
        if self.config.get('github_token'):
            self.session.headers.update({
                'Authorization': f"token {self.config['github_token']}"
            })
    
    def load_config(self):
        """加载配置文件"""
        default_config = {
            "repositories": [
                {
                    "owner": "Bloxdy",
                    "repo": "code-api",
                    "branch": "main",
                    "save_dir": "./downloaded_repos/code-api"
                }
            ],
            "schedule": {
                "enabled": True,
                "interval_hours": 24,
                "run_at_startup": True
            },
            "download": {
                "use_zip": True,
                "keep_history": True,
                "max_history_versions": 5
            },
            "logging": {
                "level": "INFO",
                "log_file": "crawler.log"
            },
            "retry": {
                "max_attempts": 3,
                "delay_seconds": 5
            }
        }
        
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # 合并默认配置
                    for key, value in default_config.items():
                        if key not in config:
                            config[key] = value
                    return config
            except Exception as e:
                print(f"加载配置文件失败: {e}，使用默认配置")
                return default_config
        else:
            # 创建默认配置文件
            self.save_config(default_config)
            return default_config
    
    def save_config(self, config=None):
        """保存配置文件"""
        if config is None:
            config = self.config
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logging.error(f"保存配置文件失败: {e}")
    
    def setup_logging(self):
        """设置日志记录"""
        log_config = self.config.get('logging', {})
        log_level = getattr(logging, log_config.get('level', 'INFO'))
        log_file = log_config.get('log_file', 'crawler.log')
        
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def get_repo_info(self, owner, repo):
        """
        获取仓库信息
        :param owner: 仓库所有者
        :param repo: 仓库名
        :return: 仓库信息字典
        """
        url = f"https://api.github.com/repos/{owner}/{repo}"
        
        for attempt in range(self.config['retry']['max_attempts']):
            try:
                response = self.session.get(url)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                self.logger.error(f"获取仓库信息失败 (尝试 {attempt + 1}/{self.config['retry']['max_attempts']}): {e}")
                if attempt < self.config['retry']['max_attempts'] - 1:
                    time.sleep(self.config['retry']['delay_seconds'])
                else:
                    raise
    
    def download_repo_zip(self, owner, repo, branch="main", save_dir="./downloads"):
        """
        下载仓库ZIP文件
        :param owner: 仓库所有者
        :param repo: 仓库名
        :param branch: 分支名
        :param save_dir: 保存目录
        :return: 下载的文件路径
        """
        # 构建下载URL
        zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip"
        
        # 创建保存目录
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"{repo}_{branch}_{timestamp}.zip"
        zip_path = save_path / zip_filename
        
        self.logger.info(f"开始下载: {owner}/{repo} ({branch})")
        
        for attempt in range(self.config['retry']['max_attempts']):
            try:
                response = self.session.get(zip_url, stream=True, timeout=60)
                response.raise_for_status()
                
                # 下载文件
                total_size = int(response.headers.get('content-length', 0))
                downloaded = 0
                
                with open(zip_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                progress = (downloaded / total_size) * 100
                                if downloaded % (1024 * 1024) < 8192:  # 每MB更新一次
                                    self.logger.info(f"下载进度: {progress:.1f}%")
                
                self.logger.info(f"下载完成: {zip_path}")
                return str(zip_path)
                
            except requests.exceptions.RequestException as e:
                self.logger.error(f"下载失败 (尝试 {attempt + 1}/{self.config['retry']['max_attempts']}): {e}")
                if attempt < self.config['retry']['max_attempts'] - 1:
                    time.sleep(self.config['retry']['delay_seconds'])
                else:
                    raise
    
    def extract_zip(self, zip_path, extract_dir):
        """
        解压ZIP文件
        :param zip_path: ZIP文件路径
        :param extract_dir: 解压目录
        """
        self.logger.info(f"解压文件: {zip_path}")
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            self.logger.info(f"解压完成: {extract_dir}")
            
            # 如果配置了不保留ZIP，则删除
            if not self.config['download'].get('keep_zip', True):
                os.remove(zip_path)
                self.logger.info(f"删除ZIP文件: {zip_path}")
                
        except Exception as e:
            self.logger.error(f"解压失败: {e}")
            raise
    
    def cleanup_old_versions(self, save_dir, repo_name, keep_count=5):
        """
        清理旧版本文件
        :param save_dir: 保存目录
        :param repo_name: 仓库名
        :param keep_count: 保留的版本数量
        """
        save_path = Path(save_dir)
        if not save_path.exists():
            return
        
        # 获取所有相关文件
        files = sorted(
            save_path.glob(f"{repo_name}_*.zip"),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        
        # 删除旧版本
        if len(files) > keep_count:
            for old_file in files[keep_count:]:
                try:
                    os.remove(old_file)
                    self.logger.info(f"删除旧版本: {old_file}")
                except Exception as e:
                    self.logger.error(f"删除旧版本失败: {old_file} - {e}")
    
    def crawl_repository(self, repo_config):
        """
        爬取单个仓库
        :param repo_config: 仓库配置
        :return: 是否成功
        """
        owner = repo_config['owner']
        repo = repo_config['repo']
        branch = repo_config.get('branch', 'main')
        save_dir = repo_config.get('save_dir', f"./downloads/{repo}")
        
        try:
            self.logger.info(f"开始爬取仓库: {owner}/{repo}")
            
            # 获取仓库信息
            repo_info = self.get_repo_info(owner, repo)
            self.logger.info(f"仓库信息: {repo_info.get('description', '无描述')}")
            self.logger.info(f"最后更新: {repo_info.get('updated_at', '未知')}")
            
            # 下载ZIP文件
            if self.config['download'].get('use_zip', True):
                zip_path = self.download_repo_zip(owner, repo, branch, save_dir)
                
                # 解压文件
                extract_dir = Path(save_dir) / f"{repo}_{branch}_latest"
                self.extract_zip(zip_path, str(extract_dir))
                
                # 清理旧版本
                if self.config['download'].get('keep_history', True):
                    self.cleanup_old_versions(
                        save_dir, 
                        repo, 
                        self.config['download'].get('max_history_versions', 5)
                    )
            
            self.logger.info(f"爬取完成: {owner}/{repo}")
            return True
            
        except Exception as e:
            self.logger.error(f"爬取失败 {owner}/{repo}: {e}")
            return False
    
    def crawl_all(self):
        """爬取所有配置的仓库"""
        self.logger.info("开始批量爬取任务")
        
        repositories = self.config.get('repositories', [])
        if not repositories:
            self.logger.warning("没有配置任何仓库")
            return
        
        success_count = 0
        fail_count = 0
        
        for repo_config in repositories:
            if self.crawl_repository(repo_config):
                success_count += 1
            else:
                fail_count += 1
            
            # 添加延迟，避免请求过于频繁
            time.sleep(2)
        
        self.logger.info(f"批量爬取完成 - 成功: {success_count}, 失败: {fail_count}")
    
    def run_scheduled(self):
        """运行定时任务"""
        self.logger.info("启动定时爬取服务")
        
        # 立即执行一次
        if self.config['schedule'].get('run_at_startup', True):
            self.crawl_all()
        
        # 设置定时任务
        interval_hours = self.config['schedule'].get('interval_hours', 24)
        
        if interval_hours < 1:
            # 小于1小时，使用分钟
            schedule.every(int(interval_hours * 60)).minutes.do(self.crawl_all)
        else:
            schedule.every(interval_hours).hours.do(self.crawl_all)
        
        self.logger.info(f"定时任务已设置 - 每 {interval_hours} 小时执行一次")
        
        # 保持运行
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # 每分钟检查一次
        except KeyboardInterrupt:
            self.logger.info("定时服务已停止")


def create_example_config():
    """创建示例配置文件"""
    example_config = {
        "repositories": [
            {
                "owner": "Bloxdy",
                "repo": "code-api",
                "branch": "main",
                "save_dir": "./downloaded_repos/code-api",
                "description": "BloxD Code API"
            }
        ],
        "github_token": "",  # 可选，用于提高API限制
        "schedule": {
            "enabled": True,
            "interval_hours": 24,
            "run_at_startup": True
        },
        "download": {
            "use_zip": True,
            "keep_zip": False,
            "keep_history": True,
            "max_history_versions": 5
        },
        "logging": {
            "level": "INFO",
            "log_file": "crawler.log"
        },
        "retry": {
            "max_attempts": 3,
            "delay_seconds": 5
        }
    }
    
    config_path = "crawler_config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(example_config, f, indent=2, ensure_ascii=False)
    
    print(f"已创建示例配置文件: {config_path}")
    return config_path


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='GitHub代码库定期爬取工具')
    parser.add_argument('--config', '-c', default='crawler_config.json', 
                        help='配置文件路径')
    parser.add_argument('--init', '-i', action='store_true',
                        help='创建示例配置文件')
    parser.add_argument('--run-once', '-o', action='store_true',
                        help='立即执行一次爬取')
    parser.add_argument('--add-repo', '-a', nargs=3, metavar=('OWNER', 'REPO', 'BRANCH'),
                        help='添加仓库到配置')
    
    args = parser.parse_args()
    
    # 创建示例配置
    if args.init:
        create_example_config()
        return
    
    # 初始化爬虫
    crawler = GitHubCrawler(args.config)
    
    # 添加新仓库
    if args.add_repo:
        owner, repo, branch = args.add_repo
        new_repo = {
            "owner": owner,
            "repo": repo,
            "branch": branch,
            "save_dir": f"./downloaded_repos/{repo}"
        }
        crawler.config['repositories'].append(new_repo)
        crawler.save_config()
        print(f"已添加仓库: {owner}/{repo}")
        return
    
    # 立即执行一次
    if args.run_once:
        crawler.crawl_all()
        return
    
    # 启动定时服务
    if crawler.config['schedule'].get('enabled', True):
        crawler.run_scheduled()
    else:
        print("定时任务已禁用，使用 --run-once 执行单次爬取")


if __name__ == "__main__":
    main()
