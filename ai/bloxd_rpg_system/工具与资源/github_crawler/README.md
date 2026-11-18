# GitHub 代码库定期爬取工具

一个Python工具，用于定期爬取GitHub公开代码库并保存到本地。

## 功能特点

- ✅ **自动下载** - 支持ZIP格式下载GitHub仓库
- ✅ **定时任务** - 可配置定时自动爬取（支持每小时/每天）
- ✅ **增量更新** - 保留历史版本，可配置保留数量
- ✅ **错误重试** - 网络错误自动重试
- ✅ **日志记录** - 完整的操作日志
- ✅ **多仓库支持** - 可同时监控多个仓库
- ✅ **易于使用** - 提供Windows批处理脚本，一键运行

## 文件结构

```
github_crawler/
├── github_crawler.py    # 主程序
├── crawler_config.json  # 配置文件
├── run_crawler.bat      # Windows批处理脚本
├── test_crawler.py      # 测试脚本
└── README.md            # 使用说明
```

## 快速开始

### 方法一：使用Windows批处理脚本（推荐）

1. **双击运行** `run_crawler.bat`
2. 按提示选择操作：
   - 选项1：立即执行单次爬取
   - 选项2：启动定时服务（每24小时自动爬取）
   - 选项3：创建示例配置文件
   - 选项4：添加新仓库
   - 选项5：查看日志

### 方法二：命令行使用

```bash
# 安装依赖
pip install requests schedule

# 立即执行一次
python github_crawler.py --run-once

# 启动定时服务
python github_crawler.py

# 创建示例配置
python github_crawler.py --init

# 添加新仓库
python github_crawler.py --add-repo owner repo branch
```

## 配置文件说明

`crawler_config.json`：

```json
{
  "repositories": [
    {
      "owner": "Bloxdy",
      "repo": "code-api",
      "branch": "main",
      "save_dir": "./downloaded_repos/code-api",
      "description": "BloxD Code API"
    }
  ],
  "github_token": "",
  "schedule": {
    "enabled": true,
    "interval_hours": 24,
    "run_at_startup": true
  },
  "download": {
    "use_zip": true,
    "keep_zip": false,
    "keep_history": true,
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
```

## 使用示例

### 示例1：爬取BloxD Code API

1. 编辑 `crawler_config.json`，配置仓库信息
2. 运行：
```bash
python github_crawler.py --run-once
```

### 示例2：添加新仓库

```bash
python github_crawler.py --add-repo microsoft vscode main
```

### 示例3：每小时检查更新

修改配置文件：
```json
{
  "schedule": {
    "enabled": true,
    "interval_hours": 1,
    "run_at_startup": true
  }
}
```

## 常见问题

**Q: 提示"未检测到Python"**
A: 请先安装Python 3.7或更高版本

**Q: 如何停止定时服务？**
A: 按 `Ctrl+C` 即可停止服务

**Q: 支持私有仓库吗？**
A: 当前版本只支持公开仓库

## 更新日志

### v1.0.0 (2026-05-07)
- 初始版本发布
- 支持ZIP下载和解压
- 支持定时任务
- 支持多仓库配置
