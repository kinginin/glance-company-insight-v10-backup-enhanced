// 认证服务 - 与服务器API同步
import { toast } from "@/components/ui/use-toast";

// 部门类型定义
export type Department = 
  | 'admin'      // 管理员
  | 'leader'     // 领导
  | 'design'     // 设计部
  | 'procurement'// 采购部
  | 'production' // 生产部
  | 'assembly'   // 装调部
  | 'electrical' // 电气部
  | 'quality';   // 检验部

// 用户角色类型
export type UserRole = 
  | 'admin'           // 管理员
  | 'leader'          // 领导
  | 'manager'         // 部门经理
  | 'deputy_manager'  // 部门副经理
  | 'employee';       // 普通员工

// 部门名称映射
export const departmentNames: Record<Department, string> = {
  'admin': '管理员',
  'leader': '领导',
  'design': '设计部',
  'procurement': '采购部',
  'production': '生产部',
  'assembly': '装调部',
  'electrical': '电气部',
  'quality': '检验部'
};

// 角色名称映射
export const roleNames: Record<UserRole, string> = {
  'admin': '管理员',
  'leader': '领导',
  'manager': '部门经理',
  'deputy_manager': '部门副经理',
  'employee': '普通员工'
};

// 部门路由映射
export const departmentRoutes: Record<Department, string> = {
  'admin': '/dashboard',
  'leader': '/dashboard',
  'design': '/departments/design',
  'procurement': '/departments/procurement',
  'production': '/departments/production',
  'assembly': '/departments/assembly',
  'electrical': '/departments/electrical',
  'quality': '/departments/quality'
};

// 工序对应的部门
export const processDepartments: Record<string, Department> = {
  '设计': 'design',
  '采购': 'procurement',
  '生产': 'production',
  '装配': 'assembly',
  '电气': 'electrical',
  '检验': 'quality',
  '发货': 'assembly'  // 发货由装调部负责
};

// 工序顺序
export const processOrder = ['设计', '采购', '生产', '装配', '电气', '检验', '发货'];

// 用户类型定义
export interface User {
  id?: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  department: Department;
  createdAt?: string;
}

// 服务器配置缓存
let serverConfig: { inviteCode: string } | null = null;

// 获取服务器配置
const getServerConfig = async (): Promise<{ inviteCode: string }> => {
  if (serverConfig) return serverConfig;
  
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const data = await response.json();
      serverConfig = { inviteCode: data.inviteCode || 'admin' };
      return serverConfig;
    }
  } catch (e) {
    console.error('获取服务器配置失败:', e);
  }
  
  return { inviteCode: 'admin' };
};

// 从服务器获取用户列表
const fetchUsersFromServer = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      const users = await response.json();
      // 同步到localStorage作为缓存
      localStorage.setItem('users', JSON.stringify(users));
      return users;
    }
  } catch (e) {
    console.error('从服务器获取用户失败:', e);
  }
  
  // 如果服务器请求失败，使用本地缓存
  return JSON.parse(localStorage.getItem('users') || '[]');
};

// 保存用户到服务器
const saveUsersToServer = async (users: User[]): Promise<boolean> => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
    if (response.ok) {
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    }
  } catch (e) {
    console.error('保存用户到服务器失败:', e);
  }
  
  // 即使服务器保存失败，也保存到本地
  localStorage.setItem('users', JSON.stringify(users));
  return false;
};

// 初始化用户数据
const initializeUsers = async () => {
  await fetchUsersFromServer();
};

// 初始化执行
initializeUsers();

// 获取所有用户（同步版本，使用缓存）
export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem('users') || '[]');
};

// 获取所有用户（异步版本，从服务器获取）
export const getUsersAsync = async (): Promise<User[]> => {
  return await fetchUsersFromServer();
};

// 刷新用户数据
export const refreshUsers = async (): Promise<void> => {
  await fetchUsersFromServer();
};

// 获取当前登录用户
export const getCurrentUser = (): User | null => {
  const currentUser = localStorage.getItem('currentUser');
  return currentUser ? JSON.parse(currentUser) : null;
};

// 检查用户是否是管理员
export const isAdmin = (): boolean => {
  const currentUser = getCurrentUser();
  return currentUser?.role === 'admin';
};

// 检查用户是否是管理员或领导
export const isAdminOrLeader = (): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'leader';
};

// 检查用户是否是部门经理（包括正副经理）
export const isManager = (): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  return currentUser.role === 'manager' || currentUser.role === 'deputy_manager';
};

// 检查用户是否是部门经理或更高权限
export const isManagerOrAbove = (): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  return ['admin', 'leader', 'manager', 'deputy_manager'].includes(currentUser.role);
};

// 检查用户是否有权限访问某个部门
export const canAccessDepartment = (targetDepartment: Department): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // 管理员和领导可以访问所有部门
  if (currentUser.role === 'admin' || currentUser.role === 'leader') {
    return true;
  }
  
  // 其他部门只能访问自己的部门
  return currentUser.department === targetDepartment;
};

// 获取用户可访问的部门列表
export const getAccessibleDepartments = (): Department[] => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  
  // 管理员和领导可以访问所有部门
  if (currentUser.role === 'admin' || currentUser.role === 'leader') {
    return Object.keys(departmentNames) as Department[];
  }
  
  // 其他部门只能访问自己的部门
  return [currentUser.department];
};

// 获取某个部门的所有用户
export const getDepartmentUsers = (department: Department): User[] => {
  const users = getUsers();
  return users.filter(u => u.department === department);
};

// 获取某个部门的经理
export const getDepartmentManagers = (department: Department): User[] => {
  const users = getUsers();
  return users.filter(u => 
    u.department === department && 
    (u.role === 'manager' || u.role === 'deputy_manager')
  );
};

// 获取某个部门的普通员工（包括经理，用于任务分配）
export const getDepartmentEmployees = (department: Department): User[] => {
  const users = getUsers();
  return users.filter(u => 
    u.department === department && 
    ['manager', 'deputy_manager', 'employee'].includes(u.role)
  );
};

// 验证邀请码（异步）
export const validateInviteCodeAsync = async (code: string): Promise<boolean> => {
  const config = await getServerConfig();
  return code === config.inviteCode;
};

// 验证邀请码（同步，使用缓存）
export const validateInviteCode = (code: string): boolean => {
  // 先检查缓存
  if (serverConfig) {
    return code === serverConfig.inviteCode;
  }
  // 默认邀请码
  return code === 'admin';
};

// 注册新用户（异步版本）
export const registerAsync = async (
  username: string, 
  password: string, 
  fullName: string, 
  department: Department,
  role: UserRole,
  inviteCode: string
): Promise<{ success: boolean; message: string }> => {
  // 验证邀请码
  const isValidCode = await validateInviteCodeAsync(inviteCode);
  if (!isValidCode) {
    toast({
      title: "注册失败",
      description: "邀请码无效",
      variant: "destructive",
    });
    return { success: false, message: "邀请码无效" };
  }
  
  // 从服务器获取最新用户列表
  const users = await fetchUsersFromServer();
  
  // 检查用户名是否已存在
  if (users.some(u => u.username === username)) {
    toast({
      title: "注册失败",
      description: "用户名已存在",
      variant: "destructive",
    });
    return { success: false, message: "用户名已存在" };
  }
  
  // 检查部门经理数量限制
  if (role === 'manager' || role === 'deputy_manager') {
    const departmentManagers = users.filter(u => 
      u.department === department && 
      (u.role === 'manager' || u.role === 'deputy_manager')
    );
    const managerCount = departmentManagers.filter(u => u.role === 'manager').length;
    const deputyCount = departmentManagers.filter(u => u.role === 'deputy_manager').length;
    
    if (role === 'manager' && managerCount >= 1) {
      toast({
        title: "注册失败",
        description: "该部门已有经理",
        variant: "destructive",
      });
      return { success: false, message: "该部门已有经理" };
    }
    
    if (role === 'deputy_manager' && deputyCount >= 1) {
      toast({
        title: "注册失败",
        description: "该部门已有副经理",
        variant: "destructive",
      });
      return { success: false, message: "该部门已有副经理" };
    }
  }
  
  // 通过服务器API注册
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        fullName,
        department,
        inviteCode
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 刷新用户列表
      await fetchUsersFromServer();
      
      toast({
        title: "注册成功",
        description: `账号 ${username} 已创建`,
      });
      
      return { success: true, message: "注册成功" };
    } else {
      toast({
        title: "注册失败",
        description: data.error || "注册失败",
        variant: "destructive",
      });
      return { success: false, message: data.error || "注册失败" };
    }
  } catch (e) {
    // 服务器请求失败，使用本地存储
    const newUser: User = {
      id: 'user_' + Date.now(),
      username,
      password,
      fullName,
      role,
      department,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    users.push(newUser);
    await saveUsersToServer(users);
    
    toast({
      title: "注册成功",
      description: `账号 ${username} 已创建（本地）`,
    });
    
    return { success: true, message: "注册成功" };
  }
};

// 注册新用户（同步版本，保持向后兼容）
export const register = (
  username: string, 
  password: string, 
  fullName: string, 
  department: Department,
  role: UserRole,
  inviteCode: string
): { success: boolean; message: string } => {
  // 验证邀请码
  if (!validateInviteCode(inviteCode)) {
    toast({
      title: "注册失败",
      description: "邀请码无效",
      variant: "destructive",
    });
    return { success: false, message: "邀请码无效" };
  }
  
  const users = getUsers();
  
  // 检查用户名是否已存在
  if (users.some(u => u.username === username)) {
    toast({
      title: "注册失败",
      description: "用户名已存在",
      variant: "destructive",
    });
    return { success: false, message: "用户名已存在" };
  }
  
  // 创建新用户
  const newUser: User = {
    id: 'user_' + Date.now(),
    username,
    password,
    fullName,
    role,
    department,
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  users.push(newUser);
  
  // 异步保存到服务器
  saveUsersToServer(users);
  
  toast({
    title: "注册成功",
    description: `账号 ${username} 已创建`,
  });
  
  return { success: true, message: "注册成功" };
};

// 登录函数（异步版本）
export const loginAsync = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      // 刷新用户列表
      await fetchUsersFromServer();
      // 刷新服务器配置
      serverConfig = null;
      await getServerConfig();
      
      toast({
        title: "登录成功",
        description: `欢迎回来，${data.user.fullName}`,
      });
      return true;
    } else {
      toast({
        title: "登录失败",
        description: data.error || "用户名或密码不正确",
        variant: "destructive",
      });
      return false;
    }
  } catch (e) {
    // 服务器请求失败，使用本地验证
    return login(username, password);
  }
};

// 登录函数（同步版本）
export const login = (username: string, password: string): boolean => {
  const users = getUsers();
  const user = users.find((u: User) => u.username === username && u.password === password);
  
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    toast({
      title: "登录成功",
      description: `欢迎回来，${user.fullName}`,
    });
    return true;
  }
  
  toast({
    title: "登录失败",
    description: "用户名或密码不正确",
    variant: "destructive",
  });
  return false;
};

// 退出登录
export const logout = (): void => {
  localStorage.removeItem('currentUser');
  toast({
    title: "已退出登录",
    description: "您已成功退出系统",
  });
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('currentUser') !== null;
};

// 更新用户信息
export const updateUser = async (updatedUser: User): Promise<boolean> => {
  const users = await fetchUsersFromServer();
  const index = users.findIndex(u => u.username === updatedUser.username);
  
  if (index !== -1) {
    users[index] = updatedUser;
    await saveUsersToServer(users);
    
    // 如果更新的是当前用户，同步更新currentUser
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === updatedUser.username) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    
    return true;
  }
  return false;
};

// 获取部门名称
export const getDepartmentName = (department: Department): string => {
  return departmentNames[department] || department;
};

// 获取角色名称
export const getRoleName = (role: UserRole): string => {
  return roleNames[role] || role;
};

// 删除用户
export const deleteUser = async (username: string): Promise<boolean> => {
  const users = await fetchUsersFromServer();
  const currentUser = getCurrentUser();
  
  // 不能删除当前登录用户
  if (currentUser && currentUser.username === username) {
    toast({
      title: "删除失败",
      description: "不能删除当前登录的用户",
      variant: "destructive",
    });
    return false;
  }
  
  // 不能删除最后一个管理员
  const adminUsers = users.filter(u => u.role === 'admin');
  const targetUser = users.find(u => u.username === username);
  if (targetUser?.role === 'admin' && adminUsers.length <= 1) {
    toast({
      title: "删除失败",
      description: "不能删除最后一个管理员账号",
      variant: "destructive",
    });
    return false;
  }
  
  // 通过服务器API删除
  try {
    const response = await fetch(`/api/users/${username}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await fetchUsersFromServer();
      toast({
        title: "删除成功",
        description: `用户 ${username} 已删除`,
      });
      return true;
    }
  } catch (e) {
    console.error('删除用户失败:', e);
  }
  
  // 服务器删除失败，使用本地删除
  const filteredUsers = users.filter(u => u.username !== username);
  await saveUsersToServer(filteredUsers);
  
  toast({
    title: "删除成功",
    description: `用户 ${username} 已删除`,
  });
  
  return true;
};
