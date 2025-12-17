/**
 * 公司管理系统 - Electron 桌面客户端
 * 用于连接服务器并显示管理系统界面
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, shell, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json');

// 默认配置
let config = {
  serverUrl: 'http://localhost:3000',
  windowWidth: 1400,
  windowHeight: 900,
  rememberServer: true,
  autoConnect: true
};

// 加载配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...savedConfig };
    }
  } catch (e) {
    console.error('加载配置失败:', e);
  }
}

// 保存配置
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

// 主窗口
let mainWindow = null;
let settingsWindow = null;
let tray = null;

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: config.windowWidth,
    height: config.windowHeight,
    minWidth: 1024,
    minHeight: 768,
    title: '公司管理系统',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 如果有保存的服务器地址且开启自动连接，直接加载
  if (config.serverUrl && config.autoConnect) {
    loadServerUrl(config.serverUrl);
  } else {
    showServerSelector();
  }

  // 保存窗口大小
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    config.windowWidth = width;
    config.windowHeight = height;
    saveConfig();
  });

  // 窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 创建菜单
  createMenu();
}

// 加载服务器URL
function loadServerUrl(serverUrl) {
  mainWindow.loadURL(serverUrl).catch(err => {
    console.error('加载失败:', err);
    showConnectionError(serverUrl);
  });

  // 处理加载错误
  mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription);
    showConnectionError(serverUrl);
  });
}

// 显示服务器选择界面
function showServerSelector() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>连接服务器</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 50px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          max-width: 500px;
          width: 90%;
        }
        .logo {
          font-size: 60px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        p {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 30px;
        }
        .input-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          text-align: left;
          margin-bottom: 8px;
          font-size: 14px;
        }
        input[type="text"] {
          width: 100%;
          padding: 15px 20px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          background: rgba(255,255,255,0.9);
          color: #333;
        }
        input[type="text"]:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 25px;
          justify-content: center;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }
        button {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
          color: #667eea;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        .hint {
          margin-top: 20px;
          font-size: 12px;
          opacity: 0.7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🏢</div>
        <h1>公司管理系统</h1>
        <p>请输入服务器地址以连接</p>
        <div class="input-group">
          <label>服务器地址</label>
          <input type="text" id="serverUrl" value="${config.serverUrl}" placeholder="http://服务器IP:端口">
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="rememberServer" ${config.rememberServer ? 'checked' : ''}>
          <label for="rememberServer">记住服务器地址</label>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="autoConnect" ${config.autoConnect ? 'checked' : ''}>
          <label for="autoConnect">下次自动连接</label>
        </div>
        <button onclick="connect()">连接服务器</button>
        <p class="hint">示例: http://192.168.1.100:3000</p>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        
        document.getElementById('serverUrl').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') connect();
        });
        
        function connect() {
          const serverUrl = document.getElementById('serverUrl').value.trim();
          const rememberServer = document.getElementById('rememberServer').checked;
          const autoConnect = document.getElementById('autoConnect').checked;
          
          if (!serverUrl) {
            alert('请输入服务器地址');
            return;
          }
          
          ipcRenderer.send('connect-server', { serverUrl, rememberServer, autoConnect });
        }
      </script>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// 显示连接错误
function showConnectionError(serverUrl) {
  const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>连接失败</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 50px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          max-width: 500px;
          width: 90%;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 15px;
        }
        p {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 10px;
          line-height: 1.6;
        }
        .server-url {
          background: rgba(0,0,0,0.2);
          padding: 12px 20px;
          border-radius: 8px;
          font-family: 'Consolas', monospace;
          margin: 20px 0;
          word-break: break-all;
          font-size: 14px;
        }
        .buttons {
          margin-top: 30px;
          display: flex;
          gap: 15px;
        }
        button {
          flex: 1;
          padding: 15px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-primary {
          background: white;
          color: #667eea;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        .btn-secondary {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.3);
        }
        .tips {
          margin-top: 25px;
          text-align: left;
          background: rgba(0,0,0,0.2);
          padding: 15px 20px;
          border-radius: 10px;
          font-size: 13px;
        }
        .tips h4 {
          margin-bottom: 10px;
        }
        .tips li {
          margin-left: 20px;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔌</div>
        <h1>无法连接到服务器</h1>
        <p>请检查服务器是否已启动，以及网络连接是否正常。</p>
        <div class="server-url">${serverUrl}</div>
        <div class="buttons">
          <button class="btn-primary" onclick="retry()">重新连接</button>
          <button class="btn-secondary" onclick="changeServer()">更换服务器</button>
        </div>
        <div class="tips">
          <h4>💡 可能的原因：</h4>
          <ul>
            <li>服务器未启动（双击"启动服务器.bat"）</li>
            <li>服务器地址或端口不正确</li>
            <li>防火墙阻止了连接</li>
            <li>网络连接异常</li>
          </ul>
        </div>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        
        function retry() {
          ipcRenderer.send('retry-connection');
        }
        
        function changeServer() {
          ipcRenderer.send('change-server');
        }
      </script>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
}

// 创建设置窗口
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 450,
    parent: mainWindow,
    modal: true,
    resizable: false,
    title: '设置',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const settingsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>设置</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
          background: #f5f5f5;
          padding: 30px;
        }
        h2 {
          color: #333;
          margin-bottom: 25px;
          font-size: 22px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-weight: 500;
          font-size: 14px;
        }
        input[type="text"] {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.3s;
        }
        input[type="text"]:focus {
          outline: none;
          border-color: #667eea;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }
        .hint {
          color: #888;
          font-size: 12px;
          margin-top: 6px;
        }
        .buttons {
          margin-top: 30px;
          display: flex;
          gap: 15px;
          justify-content: flex-end;
        }
        button {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(102,126,234,0.4);
        }
        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }
        .btn-secondary:hover {
          background: #d0d0d0;
        }
        .section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <h2>⚙️ 设置</h2>
      
      <div class="section">
        <div class="section-title">服务器连接</div>
        <div class="form-group">
          <label>服务器地址</label>
          <input type="text" id="serverUrl" value="${config.serverUrl}" placeholder="http://服务器IP:端口">
          <p class="hint">示例: http://192.168.1.100:3000</p>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="rememberServer" ${config.rememberServer ? 'checked' : ''}>
          <label for="rememberServer" style="margin-bottom: 0;">记住服务器地址</label>
        </div>
        <div class="checkbox-group">
          <input type="checkbox" id="autoConnect" ${config.autoConnect ? 'checked' : ''}>
          <label for="autoConnect" style="margin-bottom: 0;">启动时自动连接</label>
        </div>
      </div>
      
      <div class="buttons">
        <button class="btn-secondary" onclick="window.close()">取消</button>
        <button class="btn-primary" onclick="saveSettings()">保存并连接</button>
      </div>
      
      <script>
        const { ipcRenderer } = require('electron');
        
        function saveSettings() {
          const serverUrl = document.getElementById('serverUrl').value.trim();
          const rememberServer = document.getElementById('rememberServer').checked;
          const autoConnect = document.getElementById('autoConnect').checked;
          
          if (!serverUrl) {
            alert('请输入服务器地址');
            return;
          }
          
          ipcRenderer.send('save-settings', { serverUrl, rememberServer, autoConnect });
        }
      </script>
    </body>
    </html>
  `;

  settingsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(settingsHtml)}`);
  settingsWindow.setMenu(null);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// 创建菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => createSettingsWindow()
        },
        {
          label: '更换服务器',
          click: () => showServerSelector()
        },
        { type: 'separator' },
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        {
          label: '强制刷新',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow.webContents.reloadIgnoringCache()
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const zoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(zoom + 0.1);
          }
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const zoom = mainWindow.webContents.getZoomFactor();
            mainWindow.webContents.setZoomFactor(Math.max(0.5, zoom - 0.1));
          }
        },
        {
          label: '重置缩放',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.setZoomFactor(1)
        },
        { type: 'separator' },
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '公司管理系统',
              detail: `版本: ${app.getVersion()}\n\n用于连接公司管理系统服务器的桌面客户端。\n\n当前服务器: ${config.serverUrl}`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 事件处理
ipcMain.on('connect-server', (event, newConfig) => {
  config.serverUrl = newConfig.serverUrl;
  config.rememberServer = newConfig.rememberServer;
  config.autoConnect = newConfig.autoConnect;
  
  if (config.rememberServer) {
    saveConfig();
  }
  
  loadServerUrl(config.serverUrl);
});

ipcMain.on('retry-connection', () => {
  loadServerUrl(config.serverUrl);
});

ipcMain.on('change-server', () => {
  showServerSelector();
});

ipcMain.on('open-settings', () => {
  createSettingsWindow();
});

ipcMain.on('save-settings', (event, newConfig) => {
  config.serverUrl = newConfig.serverUrl;
  config.rememberServer = newConfig.rememberServer;
  config.autoConnect = newConfig.autoConnect;
  saveConfig();
  
  if (settingsWindow) {
    settingsWindow.close();
  }
  
  loadServerUrl(config.serverUrl);
});

// 应用事件
app.whenReady().then(() => {
  loadConfig();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 禁止打开新窗口
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
