/**
 * 公司管理系统 - 服务器端
 * 用于托管静态文件和提供API服务
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 读取配置文件
const configPath = path.join(__dirname, 'config.json');
let config = {
  server: { port: 3000, host: '0.0.0.0' },
  app: { title: '公司管理系统', version: '3.0.0' },
  security: { inviteCode: 'admin', sessionTimeout: 86400000 },
  database: { type: 'file', dataDir: './data' }
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✓ 配置文件加载成功');
  } catch (e) {
    console.error('✗ 配置文件解析失败，使用默认配置');
  }
}

// 静态文件目录
const staticDir = path.join(__dirname, '../dist');
const dataDir = path.join(__dirname, config.database.dataDir);
const serverDir = __dirname;

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ 数据目录已创建:', dataDir);
}

// 初始化默认用户
function initDefaultUsers() {
  const usersFile = path.join(dataDir, 'users.json');
  if (!fs.existsSync(usersFile)) {
    const defaultUsers = [
      {
        id: 'user_admin',
        username: 'admin',
        password: 'admin',
        fullName: '系统管理员',
        role: 'admin',
        department: null,
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
    console.log('✓ 默认用户已创建');
  }
}

initDefaultUsers();

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// 获取MIME类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// 发送JSON响应
function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// 发送静态文件
function sendFile(res, filePath) {
  const fullPath = path.join(staticDir, filePath);
  
  // 安全检查：防止目录遍历攻击
  if (!fullPath.startsWith(staticDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // 检查文件是否存在
  if (!fs.existsSync(fullPath)) {
    // 对于SPA应用，返回index.html
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(indexPath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }
  
  // 如果是目录，返回index.html
  if (fs.statSync(fullPath).isDirectory()) {
    const indexPath = path.join(fullPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(indexPath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }
  
  // 发送文件
  res.writeHead(200, { 'Content-Type': getMimeType(fullPath) });
  res.end(fs.readFileSync(fullPath));
}

// 读取用户数据
function getUsers() {
  const usersFile = path.join(dataDir, 'users.json');
  if (fs.existsSync(usersFile)) {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }
  return [];
}

// 保存用户数据
function saveUsers(users) {
  const usersFile = path.join(dataDir, 'users.json');
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// API路由处理
function handleApi(req, res, pathname) {
  const method = req.method;
  
  // API: 获取服务器配置（公开部分）
  if (pathname === '/api/config' && method === 'GET') {
    sendJson(res, {
      server: config.server,
      app: config.app,
      inviteCode: config.security.inviteCode
    });
    return true;
  }
  
  // API: 保存服务器配置
  if (pathname === '/api/save-config' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newConfig = JSON.parse(body);
        // 合并配置
        config = { ...config, ...newConfig };
        // 保存到文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✓ 配置已保存');
        sendJson(res, { success: true, message: '配置已保存，请重启服务器生效' });
      } catch (e) {
        sendJson(res, { error: '配置格式错误' }, 400);
      }
    });
    return true;
  }
  
  // API: 健康检查
  if (pathname === '/api/health' && method === 'GET') {
    sendJson(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: config.app.version
    });
    return true;
  }
  
  // API: 获取用户列表（不包含密码）
  if (pathname === '/api/users' && method === 'GET') {
    const users = getUsers().map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      department: u.department,
      createdAt: u.createdAt
    }));
    sendJson(res, users);
    return true;
  }
  
  // API: 保存用户数据（完整）
  if (pathname === '/api/users' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const users = JSON.parse(body);
        saveUsers(users);
        sendJson(res, { success: true });
      } catch (e) {
        sendJson(res, { error: '数据格式错误' }, 400);
      }
    });
    return true;
  }
  
  // API: 删除用户
  if (pathname.startsWith('/api/users/') && method === 'DELETE') {
    const username = pathname.replace('/api/users/', '');
    const users = getUsers();
    const index = users.findIndex(u => u.username === username);
    
    if (index === -1) {
      sendJson(res, { error: '用户不存在' }, 404);
      return true;
    }
    
    if (users[index].role === 'admin') {
      sendJson(res, { error: '不能删除管理员账号' }, 403);
      return true;
    }
    
    users.splice(index, 1);
    saveUsers(users);
    console.log('✓ 用户已删除:', username);
    sendJson(res, { success: true });
    return true;
  }
  
  // API: 注册经理/领导账号（管理后台专用）
  if (pathname === '/api/register-manager' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password, fullName, role, department } = JSON.parse(body);
        
        if (!username || !password || !fullName) {
          sendJson(res, { error: '请填写所有必填字段' }, 400);
          return;
        }
        
        const users = getUsers();
        
        // 检查用户名是否已存在
        if (users.some(u => u.username === username)) {
          sendJson(res, { error: '用户名已存在' }, 400);
          return;
        }
        
        // 创建新用户
        const newUser = {
          id: 'user_' + Date.now(),
          username,
          password,
          fullName,
          role: role || 'manager',
          department: department || null,
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsers(users);
        
        console.log('✓ 新用户注册:', username, '角色:', role);
        sendJson(res, { success: true, user: { ...newUser, password: undefined } });
      } catch (e) {
        sendJson(res, { error: '数据格式错误' }, 400);
      }
    });
    return true;
  }
  
  // API: 用户登录
  if (pathname === '/api/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        const users = getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
          sendJson(res, { 
            success: true, 
            user: { ...user, password: undefined }
          });
        } else {
          sendJson(res, { error: '用户名或密码错误' }, 401);
        }
      } catch (e) {
        sendJson(res, { error: '数据格式错误' }, 400);
      }
    });
    return true;
  }
  
  // API: 用户注册（需要邀请码）
  if (pathname === '/api/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password, fullName, department, inviteCode } = JSON.parse(body);
        
        // 验证邀请码
        if (inviteCode !== config.security.inviteCode) {
          sendJson(res, { error: '邀请码错误' }, 400);
          return;
        }
        
        if (!username || !password || !fullName || !department) {
          sendJson(res, { error: '请填写所有必填字段' }, 400);
          return;
        }
        
        const users = getUsers();
        
        // 检查用户名是否已存在
        if (users.some(u => u.username === username)) {
          sendJson(res, { error: '用户名已存在' }, 400);
          return;
        }
        
        // 创建新用户（普通员工）
        const newUser = {
          id: 'user_' + Date.now(),
          username,
          password,
          fullName,
          role: 'employee',
          department,
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsers(users);
        
        console.log('✓ 新员工注册:', username, '部门:', department);
        sendJson(res, { success: true, user: { ...newUser, password: undefined } });
      } catch (e) {
        sendJson(res, { error: '数据格式错误' }, 400);
      }
    });
    return true;
  }
  
  // API: 获取部门员工列表
  if (pathname.startsWith('/api/department-users/') && method === 'GET') {
    const department = pathname.replace('/api/department-users/', '');
    const users = getUsers()
      .filter(u => u.department === department)
      .map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        department: u.department
      }));
    sendJson(res, users);
    return true;
  }
  
  // API: 获取/保存项目数据
  if (pathname === '/api/projects') {
    const projectsFile = path.join(dataDir, 'projects.json');
    
    if (method === 'GET') {
      if (fs.existsSync(projectsFile)) {
        const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
        sendJson(res, projects);
      } else {
        sendJson(res, []);
      }
      return true;
    }
    
    if (method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const projects = JSON.parse(body);
          fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
          sendJson(res, { success: true });
        } catch (e) {
          sendJson(res, { error: '数据格式错误' }, 400);
        }
      });
      return true;
    }
  }
  
  // API: 获取/保存工序数据
  if (pathname === '/api/processes') {
    const processesFile = path.join(dataDir, 'processes.json');
    
    if (method === 'GET') {
      if (fs.existsSync(processesFile)) {
        const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
        sendJson(res, processes);
      } else {
        sendJson(res, []);
      }
      return true;
    }
    
    if (method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const processes = JSON.parse(body);
          fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
          sendJson(res, { success: true });
        } catch (e) {
          sendJson(res, { error: '数据格式错误' }, 400);
        }
      });
      return true;
    }
  }
  
  // API: 获取/保存日报数据
  if (pathname === '/api/daily-reports') {
    const reportsFile = path.join(dataDir, 'daily-reports.json');
    
    if (method === 'GET') {
      if (fs.existsSync(reportsFile)) {
        const reports = JSON.parse(fs.readFileSync(reportsFile, 'utf8'));
        sendJson(res, reports);
      } else {
        sendJson(res, []);
      }
      return true;
    }
    
    if (method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const reports = JSON.parse(body);
          fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));
          sendJson(res, { success: true });
        } catch (e) {
          sendJson(res, { error: '数据格式错误' }, 400);
        }
      });
      return true;
    }
  }
  
  // ==================== 数据备份和恢复 API ====================
  
  // 通用备份函数
  function createBackupInternal(backupType = 'manual', includeConfig = false) {
    const backupDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = backupType === 'auto' ? 'auto_backup' : `backup_${timestamp}`;
    const backupPath = path.join(backupDir, backupName);
    
    // 如果是自动备份，先删除旧的自动备份
    if (backupType === 'auto' && fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    
    fs.mkdirSync(backupPath, { recursive: true });
    
    // 备份所有数据文件
    const dataFiles = ['users.json', 'projects.json', 'processes.json', 'daily-reports.json'];
    const backedUp = [];
    
    dataFiles.forEach(file => {
      const srcPath = path.join(dataDir, file);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(backupPath, file);
        fs.copyFileSync(srcPath, destPath);
        backedUp.push(file);
      }
    });
    
    // 如果需要备份配置文件
    if (includeConfig && fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, path.join(backupPath, 'config.json'));
      backedUp.push('config.json');
    }
    
    // 保存备份信息
    const backupInfo = {
      name: backupName,
      timestamp: new Date().toISOString(),
      type: backupType,
      files: backedUp
    };
    fs.writeFileSync(path.join(backupPath, 'backup-info.json'), JSON.stringify(backupInfo, null, 2));
    
    return backupInfo;
  }
  
  // API: 创建手动数据备份
  if (pathname === '/api/backup' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        let includeConfig = false;
        if (body) {
          const options = JSON.parse(body);
          includeConfig = options.includeConfig || false;
        }
        
        const backupInfo = createBackupInternal('manual', includeConfig);
        console.log('✓ 手动数据备份已创建:', backupInfo.name);
        sendJson(res, { success: true, backup: backupInfo });
      } catch (e) {
        console.error('✗ 备份失败:', e.message);
        sendJson(res, { error: '备份失败: ' + e.message }, 500);
      }
    });
    return true;
  }
  
  // API: 创建自动备份（覆盖前一次）
  if (pathname === '/api/backup/auto' && method === 'POST') {
    try {
      const backupInfo = createBackupInternal('auto', true);
      console.log('✓ 自动数据备份已创建/更新:', backupInfo.name);
      sendJson(res, { success: true, backup: backupInfo });
    } catch (e) {
      console.error('✗ 自动备份失败:', e.message);
      sendJson(res, { error: '自动备份失败: ' + e.message }, 500);
    }
    return true;
  }
  
  // API: 获取自动备份状态
  if (pathname === '/api/backup/auto/status' && method === 'GET') {
    try {
      const autoBackupPath = path.join(dataDir, 'backups', 'auto_backup');
      const infoPath = path.join(autoBackupPath, 'backup-info.json');
      
      if (fs.existsSync(infoPath)) {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        sendJson(res, { exists: true, backup: info });
      } else {
        sendJson(res, { exists: false });
      }
    } catch (e) {
      sendJson(res, { exists: false, error: e.message });
    }
    return true;
  }
  
  // API: 获取备份列表
  if (pathname === '/api/backups' && method === 'GET') {
    try {
      const backupDir = path.join(dataDir, 'backups');
      if (!fs.existsSync(backupDir)) {
        sendJson(res, []);
        return true;
      }
      
      const backups = [];
      const dirs = fs.readdirSync(backupDir);
      
      dirs.forEach(dir => {
        const infoPath = path.join(backupDir, dir, 'backup-info.json');
        if (fs.existsSync(infoPath)) {
          const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
          backups.push(info);
        }
      });
      
      // 按时间倒序排列
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      sendJson(res, backups);
    } catch (e) {
      sendJson(res, { error: '获取备份列表失败' }, 500);
    }
    return true;
  }
  
  // API: 恢复数据
  if (pathname.startsWith('/api/restore/') && method === 'POST') {
    const backupName = decodeURIComponent(pathname.replace('/api/restore/', ''));
    const backupPath = path.join(dataDir, 'backups', backupName);
    
    if (!fs.existsSync(backupPath)) {
      sendJson(res, { error: '备份不存在' }, 404);
      return true;
    }
    
    try {
      // 先创建当前数据的自动备份
      const autoBackupDir = path.join(dataDir, 'backups', `auto_before_restore_${Date.now()}`);
      fs.mkdirSync(autoBackupDir, { recursive: true });
      
      const dataFiles = ['users.json', 'projects.json', 'processes.json', 'daily-reports.json'];
      
      // 备份当前数据
      dataFiles.forEach(file => {
        const srcPath = path.join(dataDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, path.join(autoBackupDir, file));
        }
      });
      
      // 备份当前配置文件
      if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, path.join(autoBackupDir, 'config.json'));
      }
      
      // 保存恢复前备份信息
      const restoreBackupInfo = {
        name: path.basename(autoBackupDir),
        timestamp: new Date().toISOString(),
        type: 'auto_before_restore',
        files: [...dataFiles.filter(f => fs.existsSync(path.join(dataDir, f))), 'config.json']
      };
      fs.writeFileSync(path.join(autoBackupDir, 'backup-info.json'), JSON.stringify(restoreBackupInfo, null, 2));
      
      // 恢复数据
      const restored = [];
      dataFiles.forEach(file => {
        const srcPath = path.join(backupPath, file);
        if (fs.existsSync(srcPath)) {
          const destPath = path.join(dataDir, file);
          fs.copyFileSync(srcPath, destPath);
          restored.push(file);
        }
      });
      
      // 恢复配置文件（如果备份中包含）
      const configBackupPath = path.join(backupPath, 'config.json');
      if (fs.existsSync(configBackupPath)) {
        fs.copyFileSync(configBackupPath, configPath);
        restored.push('config.json');
        // 重新加载配置
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
          console.error('重新加载配置失败:', e.message);
        }
      }
      
      console.log('✓ 数据已恢复从:', backupName);
      sendJson(res, { success: true, restored, autoBackup: path.basename(autoBackupDir) });
    } catch (e) {
      console.error('✗ 恢复失败:', e.message);
      sendJson(res, { error: '恢复失败: ' + e.message }, 500);
    }
    return true;
  }
  
  // API: 删除备份
  if (pathname.startsWith('/api/backup/') && method === 'DELETE') {
    const backupName = pathname.replace('/api/backup/', '');
    const backupPath = path.join(dataDir, 'backups', backupName);
    
    if (!fs.existsSync(backupPath)) {
      sendJson(res, { error: '备份不存在' }, 404);
      return true;
    }
    
    try {
      // 递归删除目录
      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log('✓ 备份已删除:', backupName);
      sendJson(res, { success: true });
    } catch (e) {
      sendJson(res, { error: '删除失败: ' + e.message }, 500);
    }
    return true;
  }
  
  // API: 获取服务器端管理系统数据（用于恢复后同步到前端）
  if (pathname === '/api/sync-data' && method === 'GET') {
    try {
      const result = {
        projects: [],
        processes: [],
        dailyReports: []
      };
      
      const projectsFile = path.join(dataDir, 'projects.json');
      const processesFile = path.join(dataDir, 'processes.json');
      const dailyReportsFile = path.join(dataDir, 'daily-reports.json');
      
      if (fs.existsSync(projectsFile)) {
        result.projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
      }
      if (fs.existsSync(processesFile)) {
        result.processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
      }
      if (fs.existsSync(dailyReportsFile)) {
        result.dailyReports = JSON.parse(fs.readFileSync(dailyReportsFile, 'utf8'));
      }
      
      sendJson(res, result);
    } catch (e) {
      sendJson(res, { error: '获取数据失败: ' + e.message }, 500);
    }
    return true;
  }
  
  // API: 获取数据统计
  if (pathname === '/api/data-stats' && method === 'GET') {
    try {
      const stats = {
        users: 0,
        projects: 0,
        processes: 0,
        dailyReports: 0,
        backups: 0,
        dataSize: 0
      };
      
      const dataFiles = [
        { name: 'users.json', key: 'users' },
        { name: 'projects.json', key: 'projects' },
        { name: 'processes.json', key: 'processes' },
        { name: 'daily-reports.json', key: 'dailyReports' }
      ];
      
      dataFiles.forEach(({ name, key }) => {
        const filePath = path.join(dataDir, name);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          stats[key] = Array.isArray(data) ? data.length : 0;
          stats.dataSize += fs.statSync(filePath).size;
        }
      });
      
      // 统计备份数量
      const backupDir = path.join(dataDir, 'backups');
      if (fs.existsSync(backupDir)) {
        stats.backups = fs.readdirSync(backupDir).filter(d => 
          fs.statSync(path.join(backupDir, d)).isDirectory()
        ).length;
      }
      
      sendJson(res, stats);
    } catch (e) {
      sendJson(res, { error: '获取统计失败' }, 500);
    }
    return true;
  }
  
  return false;
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  // 配置界面路由
  if (pathname === '/admin' || pathname === '/admin/') {
    const configUiPath = path.join(serverDir, 'config-ui.html');
    if (fs.existsSync(configUiPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(configUiPath));
    } else {
      res.writeHead(404);
      res.end('配置界面未找到');
    }
    return;
  }
  
  // 处理API请求
  if (pathname.startsWith('/api/')) {
    if (!handleApi(req, res, pathname)) {
      sendJson(res, { error: 'API not found' }, 404);
    }
    return;
  }
  
  // 处理静态文件请求
  sendFile(res, pathname === '/' ? '/index.html' : pathname);
});

// 获取本机IP地址
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// 启动服务器
const { port, host } = config.server;
const localIP = getLocalIP();

server.listen(port, host, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║              公司管理系统 - 服务器已启动                        ║');
  console.log('║                                                                ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                ║');
  console.log(`║   本机访问:     http://localhost:${port}                            ║`);
  console.log(`║   局域网访问:   http://${localIP}:${port}                         ║`);
  console.log(`║   配置界面:     http://localhost:${port}/admin                      ║`);
  console.log('║                                                                ║');
  console.log('║   配置文件: server/config.json                                 ║');
  console.log('║   数据目录: server/data/                                       ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('提示: 访问 /admin 可打开可视化配置界面');
  console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
