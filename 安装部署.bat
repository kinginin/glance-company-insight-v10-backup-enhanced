@echo off
chcp 65001 >nul
title 公司管理系统 - 一键安装部署

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║              公司管理系统 - 一键安装部署工具                    ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: 创建日志文件
set LOGFILE=%~dp0install_log.txt
echo 安装日志 - %date% %time% > "%LOGFILE%"
echo ================================== >> "%LOGFILE%"

:: 进入项目目录
cd /d "%~dp0"
echo 工作目录: %CD% >> "%LOGFILE%"

:: ============================================
:: 步骤 1: 检查 Node.js
:: ============================================
echo [步骤 1/4] 检查 Node.js 环境...
echo. >> "%LOGFILE%"
echo [步骤 1] 检查 Node.js >> "%LOGFILE%"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║   [错误] 未检测到 Node.js                                       ║
    echo ║                                                                ║
    echo ║   Node.js 是运行本系统的必需环境，请先安装:                      ║
    echo ║                                                                ║
    echo ║   1. 访问 https://nodejs.org/                                  ║
    echo ║   2. 点击绿色按钮下载 LTS 版本                                  ║
    echo ║   3. 双击下载的安装包，一直点"下一步"完成安装                    ║
    echo ║   4. 安装完成后，重新运行此脚本                                  ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    echo 错误: 未检测到 Node.js >> "%LOGFILE%"
    
    set /p OPEN_URL="是否打开 Node.js 下载页面? (Y/N): "
    if /i "%OPEN_URL%"=="Y" (
        start https://nodejs.org/
    )
    
    echo.
    echo 提示: 您也可以先运行 "环境检测.bat" 查看详细的环境信息
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo     Node.js 版本: %NODE_VERSION% [OK]
echo Node.js 版本: %NODE_VERSION% >> "%LOGFILE%"

:: 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo     [错误] npm 未找到，请重新安装 Node.js
    echo 错误: npm 未找到 >> "%LOGFILE%"
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo     npm 版本: v%NPM_VERSION% [OK]
echo npm 版本: v%NPM_VERSION% >> "%LOGFILE%"
echo.

:: ============================================
:: 步骤 2: 检查项目文件
:: ============================================
echo [步骤 2/4] 检查项目文件...
echo. >> "%LOGFILE%"
echo [步骤 2] 检查项目文件 >> "%LOGFILE%"

if not exist "package.json" (
    echo     [错误] 未找到 package.json 文件
    echo     请确保在正确的目录下运行此脚本
    echo 错误: 未找到 package.json >> "%LOGFILE%"
    pause
    exit /b 1
)
echo     package.json [OK]

if not exist "src" (
    echo     [错误] 未找到 src 目录
    echo     项目文件可能不完整，请重新解压
    echo 错误: 未找到 src 目录 >> "%LOGFILE%"
    pause
    exit /b 1
)
echo     src 目录 [OK]

if not exist "server\index.cjs" (
    echo     [错误] 未找到服务器文件
    echo 错误: 未找到 server\index.cjs >> "%LOGFILE%"
    pause
    exit /b 1
)
echo     server\index.cjs [OK]
echo.

:: ============================================
:: 步骤 3: 安装依赖
:: ============================================
echo [步骤 3/4] 安装项目依赖...
echo     这可能需要 3-10 分钟，取决于网络速度
echo     请耐心等待，不要关闭此窗口...
echo.
echo. >> "%LOGFILE%"
echo [步骤 3] 安装依赖 >> "%LOGFILE%"

:: 检查是否已安装依赖
if exist "node_modules" (
    echo     检测到已有 node_modules 目录
    set /p REINSTALL="是否重新安装依赖? (Y/N，默认N): "
    if /i not "%REINSTALL%"=="Y" (
        echo     跳过依赖安装
        echo 跳过依赖安装 (已存在 node_modules) >> "%LOGFILE%"
        goto BUILD
    )
    echo     正在清理旧依赖...
    rmdir /s /q node_modules 2>nul
)

:: 配置 npm 镜像 (加速下载)
echo     配置 npm 镜像源以加速下载...
call npm config set registry https://registry.npmmirror.com 2>>"%LOGFILE%"

:: 安装依赖
echo     正在安装依赖，请稍候...
echo.
echo 开始安装依赖: %time% >> "%LOGFILE%"

call npm install 2>>"%LOGFILE%"
set INSTALL_RESULT=%ERRORLEVEL%

echo 安装完成: %time%, 返回码: %INSTALL_RESULT% >> "%LOGFILE%"

if %INSTALL_RESULT% neq 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║   [错误] 依赖安装失败                                           ║
    echo ║                                                                ║
    echo ║   可能的原因:                                                   ║
    echo ║   1. 网络连接问题 - 请检查网络                                  ║
    echo ║   2. npm 缓存问题 - 尝试运行: npm cache clean --force          ║
    echo ║   3. 权限问题 - 尝试以管理员身份运行                            ║
    echo ║                                                                ║
    echo ║   详细错误信息已保存到: install_log.txt                         ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    
    set /p RETRY="是否重试安装? (Y/N): "
    if /i "%RETRY%"=="Y" (
        echo 正在清理缓存并重试...
        call npm cache clean --force 2>>"%LOGFILE%"
        call npm install 2>>"%LOGFILE%"
        if %ERRORLEVEL% neq 0 (
            echo 重试失败，请查看 install_log.txt 获取详细信息
            pause
            exit /b 1
        )
    ) else (
        pause
        exit /b 1
    )
)

echo     依赖安装完成 [OK]
echo.

:BUILD
:: ============================================
:: 步骤 4: 构建前端
:: ============================================
echo [步骤 4/4] 构建前端应用...
echo. >> "%LOGFILE%"
echo [步骤 4] 构建前端 >> "%LOGFILE%"
echo 开始构建: %time% >> "%LOGFILE%"

call npm run build 2>>"%LOGFILE%"
set BUILD_RESULT=%ERRORLEVEL%

echo 构建完成: %time%, 返回码: %BUILD_RESULT% >> "%LOGFILE%"

if %BUILD_RESULT% neq 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════════╗
    echo ║                                                                ║
    echo ║   [错误] 构建失败                                               ║
    echo ║                                                                ║
    echo ║   可能的原因:                                                   ║
    echo ║   1. 依赖未正确安装 - 删除 node_modules 后重新运行              ║
    echo ║   2. 源代码有错误 - 请检查是否修改过源代码                       ║
    echo ║                                                                ║
    echo ║   详细错误信息已保存到: install_log.txt                         ║
    echo ║                                                                ║
    echo ╚════════════════════════════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

:: 验证构建结果
if not exist "dist\index.html" (
    echo     [错误] 构建似乎未成功，未找到 dist\index.html
    echo 错误: 未找到 dist\index.html >> "%LOGFILE%"
    pause
    exit /b 1
)

echo     构建完成 [OK]
echo.

:: ============================================
:: 安装完成
:: ============================================
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║                    ✓ 安装部署成功！                             ║
echo ║                                                                ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║                                                                ║
echo ║   下一步操作:                                                   ║
echo ║                                                                ║
echo ║   1. 启动服务器: 双击 "启动服务器.bat"                          ║
echo ║                                                                ║
echo ║   2. 配置服务器: 启动后访问 http://localhost:3000/admin        ║
echo ║                                                                ║
echo ║   3. 构建客户端: 进入 client-app 目录                          ║
echo ║                  双击 "构建客户端.bat"                          ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 安装成功完成: %date% %time% >> "%LOGFILE%"

set /p START_NOW="是否现在启动服务器? (Y/N): "
if /i "%START_NOW%"=="Y" (
    echo.
    echo 正在启动服务器...
    call "启动服务器.bat"
) else (
    echo.
    echo 您可以稍后双击 "启动服务器.bat" 启动服务器
    pause
)
