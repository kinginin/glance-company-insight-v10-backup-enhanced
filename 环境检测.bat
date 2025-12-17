@echo off
chcp 65001 >nul
title 公司管理系统 - 环境检测工具

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              公司管理系统 - 环境检测工具                        ║
echo ║                                                                ║
echo ║   此工具将检测您的系统是否满足运行要求                          ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set ERRORS=0
set WARNINGS=0

echo ══════════════════════════════════════════════════════════════════
echo                        系统环境检测
echo ══════════════════════════════════════════════════════════════════
echo.

:: ============================================
:: 检测操作系统
:: ============================================
echo [1/7] 检测操作系统...
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo       Windows 版本: %VERSION%
if "%VERSION%"=="10.0" (
    echo       状态: [OK] Windows 10/11
) else if "%VERSION%"=="6.3" (
    echo       状态: [OK] Windows 8.1
) else if "%VERSION%"=="6.2" (
    echo       状态: [OK] Windows 8
) else (
    echo       状态: [警告] 建议使用 Windows 10 或更高版本
    set /a WARNINGS+=1
)
echo.

:: ============================================
:: 检测 Node.js
:: ============================================
echo [2/7] 检测 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo       状态: [错误] 未安装 Node.js
    echo.
    echo       ┌─────────────────────────────────────────────────────────┐
    echo       │  Node.js 是运行服务器的必需环境                          │
    echo       │                                                         │
    echo       │  请按以下步骤安装:                                       │
    echo       │  1. 访问 https://nodejs.org/                            │
    echo       │  2. 点击下载 LTS 版本 (推荐)                             │
    echo       │  3. 运行安装程序，一直点"下一步"即可                      │
    echo       │  4. 安装完成后重新运行此检测程序                          │
    echo       └─────────────────────────────────────────────────────────┘
    echo.
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo       已安装版本: %NODE_VER%
    
    :: 检查版本号是否足够
    for /f "tokens=1 delims=v." %%a in ("%NODE_VER%") do set NODE_MAJOR=%%a
    if %NODE_MAJOR% GEQ 16 (
        echo       状态: [OK] 版本满足要求 (需要 v16.0.0 或更高)
    ) else (
        echo       状态: [警告] 版本较低，建议升级到 v16.0.0 或更高
        set /a WARNINGS+=1
    )
)
echo.

:: ============================================
:: 检测 npm
:: ============================================
echo [3/7] 检测 npm (Node 包管理器)...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo       状态: [错误] 未检测到 npm
    echo       说明: npm 通常随 Node.js 一起安装
    echo       解决: 请重新安装 Node.js
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
    echo       已安装版本: v%NPM_VER%
    echo       状态: [OK]
)
echo.

:: ============================================
:: 检测 pnpm (可选)
:: ============================================
echo [4/7] 检测 pnpm (可选，更快的包管理器)...
where pnpm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo       状态: [提示] 未安装 pnpm
    echo       说明: pnpm 是可选的，npm 也可以正常使用
    echo       安装: 如需安装，运行命令: npm install -g pnpm
) else (
    for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VER=%%i
    echo       已安装版本: v%PNPM_VER%
    echo       状态: [OK]
)
echo.

:: ============================================
:: 检测网络连接
:: ============================================
echo [5/7] 检测网络连接...
ping -n 1 registry.npmmirror.com >nul 2>nul
if %ERRORLEVEL% neq 0 (
    ping -n 1 registry.npmjs.org >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo       状态: [警告] 无法连接到 npm 仓库
        echo       说明: 安装依赖时可能会失败
        echo       解决: 请检查网络连接或配置代理
        set /a WARNINGS+=1
    ) else (
        echo       npm 官方仓库: [OK] 可访问
    )
) else (
    echo       npm 镜像仓库: [OK] 可访问
)
echo.

:: ============================================
:: 检测项目文件
:: ============================================
echo [6/7] 检测项目文件完整性...
set FILES_OK=1

if not exist "%~dp0package.json" (
    echo       [错误] 缺少 package.json
    set FILES_OK=0
    set /a ERRORS+=1
)
if not exist "%~dp0server\index.cjs" (
    echo       [错误] 缺少 server\index.cjs
    set FILES_OK=0
    set /a ERRORS+=1
)
if not exist "%~dp0server\config.json" (
    echo       [错误] 缺少 server\config.json
    set FILES_OK=0
    set /a ERRORS+=1
)
if not exist "%~dp0src" (
    echo       [错误] 缺少 src 目录
    set FILES_OK=0
    set /a ERRORS+=1
)

if %FILES_OK%==1 (
    echo       package.json: [OK]
    echo       server\index.cjs: [OK]
    echo       server\config.json: [OK]
    echo       src 目录: [OK]
    echo       状态: [OK] 项目文件完整
)
echo.

:: ============================================
:: 检测已构建文件
:: ============================================
echo [7/7] 检测构建状态...
if exist "%~dp0dist\index.html" (
    echo       状态: [OK] 已构建 (dist 目录存在)
) else (
    echo       状态: [提示] 未构建
    echo       说明: 首次运行需要执行构建，安装脚本会自动处理
)
echo.

:: ============================================
:: 检测结果汇总
:: ============================================
echo ══════════════════════════════════════════════════════════════════
echo                        检测结果汇总
echo ══════════════════════════════════════════════════════════════════
echo.

if %ERRORS%==0 (
    if %WARNINGS%==0 (
        echo   ✓ 所有检测项通过！您的环境已准备就绪。
        echo.
        echo   您现在可以:
        echo   1. 双击 "安装部署.bat" 进行一键安装
        echo   2. 或双击 "启动服务器.bat" 启动服务器 (如已安装)
    ) else (
        echo   ⚠ 检测完成，有 %WARNINGS% 个警告。
        echo.
        echo   虽然有警告，但系统应该可以正常运行。
        echo   建议处理上述警告以获得最佳体验。
    )
) else (
    echo   ✗ 检测完成，发现 %ERRORS% 个错误，%WARNINGS% 个警告。
    echo.
    echo   请根据上述提示解决错误后，重新运行此检测程序。
    echo.
    echo   ┌─────────────────────────────────────────────────────────────┐
    echo   │  最常见的问题是未安装 Node.js                                │
    echo   │                                                             │
    echo   │  解决方法:                                                   │
    echo   │  1. 访问 https://nodejs.org/                                │
    echo   │  2. 下载并安装 LTS 版本                                      │
    echo   │  3. 安装完成后重启此检测程序                                  │
    echo   └─────────────────────────────────────────────────────────────┘
)

echo.
echo ══════════════════════════════════════════════════════════════════
echo.

:: 询问是否打开 Node.js 下载页面
if %ERRORS% GTR 0 (
    set /p OPEN_URL="是否打开 Node.js 下载页面? (Y/N): "
    if /i "%OPEN_URL%"=="Y" (
        start https://nodejs.org/
    )
)

echo.
pause
