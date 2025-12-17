@echo off
chcp 65001 >nul
title 公司管理系统 - 构建客户端

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              公司管理系统 - 客户端构建程序                      ║
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

:: 进入客户端目录
cd /d "%~dp0"

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo [步骤 1/2] 正在安装依赖...
    echo     这可能需要几分钟，请耐心等待...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo     依赖安装完成 [OK]
    echo.
) else (
    echo [步骤 1/2] 依赖已安装 [OK]
    echo.
)

:: 显示构建选项
echo [步骤 2/2] 选择构建类型:
echo.
echo   1. 安装版 (推荐) - 生成安装程序，可安装到系统
echo   2. 便携版 - 生成单个可执行文件，无需安装
echo   3. 全部构建 - 同时生成安装版和便携版
echo.
set /p BUILD_TYPE="请输入选项 (1/2/3): "

echo.
echo [信息] 正在构建，请稍候...
echo.

if "%BUILD_TYPE%"=="1" (
    call npm run build:win
) else if "%BUILD_TYPE%"=="2" (
    call npm run build:portable
) else if "%BUILD_TYPE%"=="3" (
    call npm run build:win
) else (
    echo [错误] 无效的选项
    pause
    exit /b 1
)

if %ERRORLEVEL% equ 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║                      构建成功！                                 ║
    echo ║                                                                ║
    echo ╠════════════════════════════════════════════════════════════════╣
    echo ║                                                                ║
    echo ║   输出目录: client-app\dist\                                   ║
    echo ║                                                                ║
    echo ║   安装版: 公司管理系统-2.0.0-x64.exe                           ║
    echo ║   便携版: 公司管理系统-便携版-2.0.0.exe                        ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    explorer dist
) else (
    echo.
    echo [错误] 构建失败
)

pause
