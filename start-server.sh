#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              公司管理系统 - 服务器启动程序                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js"
    echo "安装命令 (Ubuntu/Debian): sudo apt install nodejs"
    echo "安装命令 (CentOS/RHEL): sudo yum install nodejs"
    exit 1
fi

# 显示Node.js版本
echo "[信息] Node.js 版本: $(node -v)"
echo ""

# 进入服务器目录
cd server

# 启动服务器
echo "[信息] 正在启动服务器..."
echo ""
node index.cjs
