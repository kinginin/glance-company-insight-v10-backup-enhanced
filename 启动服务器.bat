@echo off
chcp 65001 >nul
title 公司管理系统 - 服务器

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              公司管理系统 - 服务器启动程序                      ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 显示Node.js版本
echo [信息] Node.js 版本:
node -v
echo.

:: 检查是否已构建
if not exist "%~dp0dist\index.html" (
    echo [警告] 未检测到构建文件，正在自动构建...
    echo.
    cd /d "%~dp0"
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [错误] 构建失败，请先运行 "安装部署.bat"
        pause
        exit /b 1
    )
    echo.
)

:: 进入服务器目录
cd /d "%~dp0server"

:: 启动服务器
echo [信息] 正在启动服务器...
echo.
node index.cjs

:: 如果服务器异常退出
echo.
echo [信息] 服务器已停止
pause
