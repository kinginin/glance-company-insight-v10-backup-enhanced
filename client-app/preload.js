/**
 * Electron 预加载脚本
 * 在渲染进程中暴露安全的API
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开设置窗口
  openSettings: () => ipcRenderer.send('open-settings'),
  
  // 获取应用版本
  getVersion: () => process.versions.electron,
  
  // 检查是否在Electron环境中
  isElectron: true
});
