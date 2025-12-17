
import { Department, processOrder, processDepartments, getCurrentUser, getDepartmentEmployees } from './auth';

// 项目状态类型
export type ProjectStatus = 'planning' | 'in-progress' | 'review' | 'completed';

// 工序状态类型
export type ProcessStatus = 'pending' | 'waiting' | 'in-progress' | 'completed';

// 任务分配信息
export interface TaskAssignment {
  department: Department;
  processName: string;
  managerId?: string;        // 分配的经理
  mainEmployeeId?: string;   // 主要负责人
  assistantIds?: string[];   // 辅助人员
  assignedAt?: string;       // 分配时间
  status: 'unassigned' | 'assigned' | 'in-progress' | 'completed';
}

// 每日工作记录
export interface DailyReport {
  id: string;
  processId: string;
  projectId: string;
  employeeId: string;
  date: string;
  content: string;          // 项目情况（必填）
  feedback?: string;        // 问题反馈（可选）
  createdAt: string;
}

// 工作工序类型定义
export interface WorkProcess {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;
  plannedDays: number;      // 规划所需天数
  actualDays?: number;      // 实际天数
  plannedStartDate: string; // 规划开始时间（部门任务开始日期）
  plannedEndDate: string;   // 规划结束时间
  actualStartDate?: string; // 实际开始时间
  actualEndDate?: string;   // 实际结束时间
  status: ProcessStatus;
  department: Department;
  managerId?: string;       // 部门经理
  mainEmployeeId?: string;  // 主要负责人
  assistantIds?: string[];  // 辅助人员
  assignedAt?: string;      // 分配时间
  completedAt?: string;     // 完成时间
  isShippingProcess?: boolean; // 是否是发货工序
}

// 项目类型定义
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  budget?: number;
  projectManager: string;   // 项目负责人（手动输入）
  createdBy: string;        // 创建者（管理员）
  createdAt: string;        // 创建时间
  completedAt?: string;     // 完成时间
}

// 工序规划数据结构（用于创建项目时）
export interface ProcessPlan {
  name: string;
  department: Department;
  description: string;
  startDate: string;        // 开始任务时间
  days: number;             // 所需天数
  isShipping?: boolean;     // 是否是发货工序
}

// 标准工作工序流程
export const standardWorkProcesses = [
  { name: "设计", department: "design" as Department, description: "进行产品设计和图纸设计", isShipping: false },
  { name: "采购", department: "procurement" as Department, description: "采购所需材料和零部件", isShipping: false },
  { name: "生产", department: "production" as Department, description: "进行零部件加工和初步组装", isShipping: false },
  { name: "装配", department: "assembly" as Department, description: "完成产品组装工作", isShipping: false },
  { name: "电气", department: "electrical" as Department, description: "进行电气系统调试", isShipping: false },
  { name: "检验", department: "quality" as Department, description: "进行质量检验和测试", isShipping: false },
  { name: "发货", department: "assembly" as Department, description: "产品包装和发货准备", isShipping: true }
];

// ==================== 数据同步到服务器 ====================

// 同步项目数据到服务器
const syncProjectsToServer = async () => {
  try {
    const projects = localStorage.getItem('projects') || '[]';
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: projects
    });
  } catch (e) {
    console.error('同步项目数据失败:', e);
  }
};

// 同步工序数据到服务器
const syncProcessesToServer = async () => {
  try {
    const processes = localStorage.getItem('workProcesses') || '[]';
    await fetch('/api/processes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: processes
    });
  } catch (e) {
    console.error('同步工序数据失败:', e);
  }
};

// 同步日报数据到服务器
const syncDailyReportsToServer = async () => {
  try {
    const reports = localStorage.getItem('dailyReports') || '[]';
    await fetch('/api/daily-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: reports
    });
  } catch (e) {
    console.error('同步日报数据失败:', e);
  }
};

// 同步所有数据到服务器
export const syncAllDataToServer = async () => {
  await Promise.all([
    syncProjectsToServer(),
    syncProcessesToServer(),
    syncDailyReportsToServer()
  ]);
};

// 从服务器加载数据到localStorage
export const loadDataFromServer = async () => {
  try {
    // 使用sync-data API一次性获取所有数据
    const syncRes = await fetch('/api/sync-data');
    if (syncRes.ok) {
      const data = await syncRes.json();
      
      // 强制更新localStorage，无论服务器数据是否为空
      localStorage.setItem('projects', JSON.stringify(data.projects || []));
      localStorage.setItem('workProcesses', JSON.stringify(data.processes || []));
      localStorage.setItem('dailyReports', JSON.stringify(data.dailyReports || []));
      
      console.log('✓ 已从服务器同步数据:', {
        projects: (data.projects || []).length,
        processes: (data.processes || []).length,
        dailyReports: (data.dailyReports || []).length
      });
      
      return true;
    }
    return false;
  } catch (e) {
    console.error('从服务器加载数据失败:', e);
    return false;
  }
};

// 检查是否有待恢复的数据（从配置界面恢复备份后跳转过来）
const checkPendingRestore = () => {
  try {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('restore') === 'true') {
      // 检查sessionStorage中的待恢复数据
      const pendingData = sessionStorage.getItem('pendingRestore');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        // 检查数据是否在5分钟内
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          // 应用恢复的数据
          localStorage.setItem('projects', JSON.stringify(data.projects || []));
          localStorage.setItem('workProcesses', JSON.stringify(data.processes || []));
          localStorage.setItem('dailyReports', JSON.stringify(data.dailyReports || []));
          console.log('✓ 已从备份恢复数据');
          // 清除待恢复数据
          sessionStorage.removeItem('pendingRestore');
          // 清除URL参数
          window.history.replaceState({}, '', window.location.pathname);
          return true;
        }
      }
    }
  } catch (e) {
    console.error('检查待恢复数据失败:', e);
  }
  return false;
};

// 初始化数据
const initializeData = async () => {
  // 首先检查是否有待恢复的数据
  if (checkPendingRestore()) {
    console.log('✓ 已从备份恢复数据');
    return;
  }
  
  // 尝试从服务器加载数据（服务器数据优先）
  const serverDataLoaded = await loadDataFromServer();
  
  // 如果服务器加载成功，localStorage已经被更新，不需要额外处理
  if (serverDataLoaded) {
    console.log('✓ 已从服务器加载数据');
    return;
  }
  
  // 如果服务器加载失败，确保dlocalStorage有默认值
  if (!localStorage.getItem('projects')) {
    localStorage.setItem('projects', JSON.stringify([]));
  }
  if (!localStorage.getItem('workProcesses')) {
    localStorage.setItem('workProcesses', JSON.stringify([]));
  }
  if (!localStorage.getItem('dailyReports')) {
    localStorage.setItem('dailyReports', JSON.stringify([]));
  }
  
  // 如果localStorage有数据，同步到服务器
  const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
  const localProcesses = JSON.parse(localStorage.getItem('workProcesses') || '[]');
  const localReports = JSON.parse(localStorage.getItem('dailyReports') || '[]');
  
  if (localProjects.length > 0 || localProcesses.length > 0 || localReports.length > 0) {
    syncAllDataToServer();
  }
};

// 执行初始化
initializeData();

// ==================== 项目相关操作 ====================

export const getProjects = (): Project[] => {
  return JSON.parse(localStorage.getItem('projects') || '[]');
};

export const getProjectById = (id: string): Project | undefined => {
  const projects = getProjects();
  return projects.find(project => project.id === id);
};

export const getProjectsByStatus = (status: ProjectStatus): Project[] => {
  const projects = getProjects();
  return projects.filter(project => project.status === status);
};

// 创建新项目（仅管理员）- 新版本支持独立的开始时间
export const createProject = (
  name: string,
  description: string,
  projectManager: string,
  startDate: string,
  endDate: string,
  processPlans: ProcessPlan[]  // 每个工序的规划（开始时间+所需天数）
): Project | null => {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const projects = getProjects();
  const id = `p${Date.now()}`;
  
  const project: Project = {
    id,
    name,
    description,
    status: 'planning',
    progress: 0,
    startDate,
    endDate,
    projectManager,
    createdBy: currentUser.username,
    createdAt: new Date().toISOString()
  };
  
  projects.push(project);
  localStorage.setItem('projects', JSON.stringify(projects));
  
  // 创建工序（使用新的规划数据）
  createProjectProcessesNew(id, endDate, processPlans);
  
  // 同步到服务器
  syncAllDataToServer();
  
  return project;
};

// 为项目创建工序（新版本 - 各部门独立开始时间）
const createProjectProcessesNew = (projectId: string, projectEndDate: string, processPlans: ProcessPlan[]) => {
  const processes = getWorkProcesses();
  
  processPlans.forEach((plan, index) => {
    const startDate = new Date(plan.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.days - 1);
    
    // 确保结束时间不超过项目结束日期
    const maxEndDate = new Date(projectEndDate);
    if (endDate > maxEndDate) {
      endDate.setTime(maxEndDate.getTime());
    }
    
    const isShipping = plan.isShipping || plan.name === '发货';
    
    processes.push({
      id: `wp-${projectId}-${index + 1}`,
      projectId,
      name: plan.name,
      description: plan.description,
      order: index + 1,
      plannedDays: plan.days,
      plannedStartDate: plan.startDate,
      plannedEndDate: endDate.toISOString().split('T')[0],
      status: isShipping ? 'pending' : 'waiting',  // 发货工序初始为pending，其他为waiting（等待分配后可开始）
      department: plan.department,
      isShippingProcess: isShipping
    });
  });
  
  localStorage.setItem('workProcesses', JSON.stringify(processes));
};

export const updateProject = (updatedProject: Project): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === updatedProject.id);
  
  if (index !== -1) {
    projects[index] = updatedProject;
    localStorage.setItem('projects', JSON.stringify(projects));
    // 同步到服务器
    syncProjectsToServer();
  }
};

export const deleteProject = (projectId: string): void => {
  const projects = getProjects();
  const filteredProjects = projects.filter(p => p.id !== projectId);
  localStorage.setItem('projects', JSON.stringify(filteredProjects));
  
  // 同时删除该项目的所有工序和日报
  const processes = getWorkProcesses();
  const filteredProcesses = processes.filter(p => p.projectId !== projectId);
  localStorage.setItem('workProcesses', JSON.stringify(filteredProcesses));
  
  const reports = getDailyReports();
  const filteredReports = reports.filter(r => r.projectId !== projectId);
  localStorage.setItem('dailyReports', JSON.stringify(filteredReports));
  
  // 同步到服务器
  syncAllDataToServer();
};

// ==================== 工序相关操作 ====================

export const getWorkProcesses = (): WorkProcess[] => {
  return JSON.parse(localStorage.getItem('workProcesses') || '[]');
};

export const getWorkProcessesByProjectId = (projectId: string): WorkProcess[] => {
  const processes = getWorkProcesses();
  return processes
    .filter(process => process.projectId === projectId)
    .sort((a, b) => a.order - b.order);
};

export const getWorkProcessById = (processId: string): WorkProcess | undefined => {
  const processes = getWorkProcesses();
  return processes.find(p => p.id === processId);
};

export const updateWorkProcess = (updatedProcess: WorkProcess): void => {
  const processes = getWorkProcesses();
  const index = processes.findIndex(p => p.id === updatedProcess.id);
  
  if (index !== -1) {
    processes[index] = updatedProcess;
    localStorage.setItem('workProcesses', JSON.stringify(processes));
    
    // 更新相关项目的进度
    updateProjectProgress(updatedProcess.projectId);
    
    // 同步到服务器
    syncProcessesToServer();
    syncProjectsToServer();
  }
};

// 检查发货工序是否可以开始（所有其他工序都已完成）
export const canShippingProcessStart = (projectId: string): boolean => {
  const processes = getWorkProcessesByProjectId(projectId);
  const nonShippingProcesses = processes.filter(p => !p.isShippingProcess && p.name !== '发货');
  
  // 所有非发货工序都必须完成
  return nonShippingProcesses.every(p => p.status === 'completed');
};

// 检查工序是否可以开始（新逻辑：非发货工序分配后即可开始，发货工序需要其他都完成）
export const canProcessStart = (processId: string): boolean => {
  const process = getWorkProcessById(processId);
  if (!process) return false;
  
  // 如果是发货工序，需要检查其他工序是否都完成
  if (process.isShippingProcess || process.name === '发货') {
    return canShippingProcessStart(process.projectId);
  }
  
  // 非发货工序，只要已分配就可以开始
  return !!process.mainEmployeeId;
};

// 分配工序给员工（部门经理操作）- 新逻辑
export const assignProcessToEmployee = (
  processId: string,
  mainEmployeeId: string,
  assistantIds: string[] = []
): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // 检查是否是经理
  if (!['admin', 'leader', 'manager', 'deputy_manager'].includes(currentUser.role)) {
    return false;
  }
  
  const processes = getWorkProcesses();
  const index = processes.findIndex(p => p.id === processId);
  
  if (index === -1) return false;
  
  const process = processes[index];
  
  // 检查部门权限（管理员和领导可以分配任何部门）
  if (currentUser.role !== 'admin' && currentUser.role !== 'leader') {
    if (process.department !== currentUser.department) {
      return false;
    }
  }
  
  // 检查是否是发货工序
  const isShipping = process.isShippingProcess || process.name === '发货';
  
  // 如果是发货工序，检查其他工序是否都完成
  if (isShipping && !canShippingProcessStart(process.projectId)) {
    return false; // 其他工序未完成，不能分配发货任务
  }
  
  // 更新工序信息
  const newStatus = isShipping 
    ? (canShippingProcessStart(process.projectId) ? 'in-progress' : 'waiting')
    : 'in-progress';  // 非发货工序分配后直接开始
  
  processes[index] = {
    ...process,
    managerId: currentUser.username,
    mainEmployeeId,
    assistantIds,
    assignedAt: new Date().toISOString(),
    status: newStatus,
    actualStartDate: newStatus === 'in-progress' ? new Date().toISOString().split('T')[0] : undefined
  };
  
  localStorage.setItem('workProcesses', JSON.stringify(processes));
  
  // 更新项目状态为进行中
  const project = getProjectById(process.projectId);
  if (project && project.status === 'planning') {
    updateProject({ ...project, status: 'in-progress' });
  }
  
  // 同步到服务器
  syncProcessesToServer();
  
  return true;
};

// 完成工序（员工操作）- 新逻辑
export const completeProcess = (processId: string): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  const processes = getWorkProcesses();
  const index = processes.findIndex(p => p.id === processId);
  
  if (index === -1) return false;
  
  const process = processes[index];
  
  // 检查是否是该工序的负责人或辅助人员
  const isAssigned = process.mainEmployeeId === currentUser.username ||
                     process.assistantIds?.includes(currentUser.username);
  
  // 管理员和领导也可以完成
  const hasPermission = currentUser.role === 'admin' || 
                        currentUser.role === 'leader' ||
                        isAssigned;
  
  if (!hasPermission) return false;
  
  // 更新工序状态
  const completedAt = new Date().toISOString();
  const actualEndDate = completedAt.split('T')[0];
  const actualStartDate = process.actualStartDate || actualEndDate;
  const actualDays = Math.ceil(
    (new Date(actualEndDate).getTime() - new Date(actualStartDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  processes[index] = {
    ...process,
    status: 'completed',
    actualEndDate,
    actualDays,
    completedAt
  };
  
  localStorage.setItem('workProcesses', JSON.stringify(processes));
  
  // 检查是否所有非发货工序都完成了，如果是，启用发货工序
  const projectProcesses = processes.filter(p => p.projectId === process.projectId);
  const nonShippingProcesses = projectProcesses.filter(p => !p.isShippingProcess && p.name !== '发货');
  const shippingProcess = projectProcesses.find(p => p.isShippingProcess || p.name === '发货');
  
  if (nonShippingProcesses.every(p => p.status === 'completed') && shippingProcess) {
    // 如果发货工序还是pending状态，更新为waiting（可以分配了）
    if (shippingProcess.status === 'pending') {
      const shippingIndex = processes.findIndex(p => p.id === shippingProcess.id);
      if (shippingIndex !== -1) {
        processes[shippingIndex] = {
          ...processes[shippingIndex],
          status: 'waiting'
        };
        localStorage.setItem('workProcesses', JSON.stringify(processes));
      }
    }
  }
  
  // 更新项目进度
  updateProjectProgress(process.projectId);
  
  // 检查项目是否全部完成（发货工序完成）
  if (process.isShippingProcess || process.name === '发货') {
    const project = getProjectById(process.projectId);
    if (project) {
      updateProject({
        ...project,
        status: 'completed',
        progress: 100,
        completedAt: completedAt
      });
    }
  }
  
  // 同步到服务器
  syncAllDataToServer();
  
  return true;
};

// 更新项目进度
export const updateProjectProgress = (projectId: string): void => {
  const projects = getProjects();
  const processes = getWorkProcessesByProjectId(projectId);
  const projectIndex = projects.findIndex(p => p.id === projectId);
  
  if (projectIndex === -1 || projects[projectIndex].status === 'completed') return;
  
  const completedCount = processes.filter(p => p.status === 'completed').length;
  const totalCount = processes.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  projects[projectIndex].progress = progress;
  localStorage.setItem('projects', JSON.stringify(projects));
};

// ==================== 日报相关操作 ====================

export const getDailyReports = (): DailyReport[] => {
  return JSON.parse(localStorage.getItem('dailyReports') || '[]');
};

export const getDailyReportsByProcessId = (processId: string): DailyReport[] => {
  const reports = getDailyReports();
  return reports
    .filter(r => r.processId === processId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getDailyReportsByProjectId = (projectId: string): DailyReport[] => {
  const reports = getDailyReports();
  return reports
    .filter(r => r.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addDailyReport = (
  processId: string,
  content: string,
  feedback?: string
): DailyReport | null => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  
  const process = getWorkProcessById(processId);
  if (!process) return null;
  
  // 检查是否是该工序的负责人或辅助人员
  const isAssigned = process.mainEmployeeId === currentUser.username ||
                     process.assistantIds?.includes(currentUser.username);
  
  // 管理员和领导也可以添加
  const hasPermission = currentUser.role === 'admin' || 
                        currentUser.role === 'leader' ||
                        isAssigned;
  
  if (!hasPermission) return null;
  
  const reports = getDailyReports();
  const today = new Date().toISOString().split('T')[0];
  
  const report: DailyReport = {
    id: `dr-${Date.now()}`,
    processId,
    projectId: process.projectId,
    employeeId: currentUser.username,
    date: today,
    content,
    feedback,
    createdAt: new Date().toISOString()
  };
  
  reports.push(report);
  localStorage.setItem('dailyReports', JSON.stringify(reports));
  
  // 同步到服务器
  syncDailyReportsToServer();
  
  return report;
};

// ==================== 部门项目查询 ====================

// 项目和工序的组合类型
export interface ProjectWithProcess {
  project: Project;
  process: WorkProcess;
}

// 获取部门的未分配项目（经理视图）
export const getDepartmentUnassignedProjects = (department: Department): ProjectWithProcess[] => {
  const processes = getWorkProcesses();
  const result: ProjectWithProcess[] = [];
  
  processes.forEach(p => {
    if (p.department !== department) return;
    
    // 发货工序特殊处理
    if (p.isShippingProcess || p.name === '发货') {
      // 只有当其他工序都完成后，且未分配时才显示
      if (p.status === 'waiting' && !p.mainEmployeeId) {
        const project = getProjectById(p.projectId);
        if (project) {
          result.push({ project, process: p });
        }
      }
      return;
    }
    
    // 非发货工序：未分配的
    if (!p.mainEmployeeId && (p.status === 'pending' || p.status === 'waiting')) {
      const project = getProjectById(p.projectId);
      if (project) {
        result.push({ project, process: p });
      }
    }
  });
  
  return result;
};

// 获取部门的进行中项目（经理视图）
export const getDepartmentInProgressProjects = (department: Department): ProjectWithProcess[] => {
  const processes = getWorkProcesses();
  const result: ProjectWithProcess[] = [];
  
  processes.forEach(p => {
    if (p.department === department && p.status === 'in-progress' && p.mainEmployeeId) {
      const project = getProjectById(p.projectId);
      if (project) {
        result.push({ project, process: p });
      }
    }
  });
  
  return result;
};

// 获取部门的已完成项目（经理视图）
export const getDepartmentCompletedProjects = (department: Department): ProjectWithProcess[] => {
  const processes = getWorkProcesses();
  const result: ProjectWithProcess[] = [];
  
  processes.forEach(p => {
    if (p.department === department && p.status === 'completed') {
      const project = getProjectById(p.projectId);
      if (project) {
        result.push({ project, process: p });
      }
    }
  });
  
  return result;
};

// 获取员工的待办任务（员工视图）
export const getEmployeePendingTasks = (username: string): ProjectWithProcess[] => {
  const processes = getWorkProcesses();
  const result: ProjectWithProcess[] = [];
  
  processes.forEach(p => {
    if ((p.mainEmployeeId === username || p.assistantIds?.includes(username)) && p.status === 'in-progress') {
      const project = getProjectById(p.projectId);
      if (project) {
        result.push({ project, process: p });
      }
    }
  });
  
  return result;
};

// 获取员工的已完成任务（员工视图）
export const getEmployeeCompletedTasks = (username: string): ProjectWithProcess[] => {
  const processes = getWorkProcesses();
  const result: ProjectWithProcess[] = [];
  
  processes.forEach(p => {
    if ((p.mainEmployeeId === username || p.assistantIds?.includes(username)) && p.status === 'completed') {
      const project = getProjectById(p.projectId);
      if (project) {
        result.push({ project, process: p });
      }
    }
  });
  
  return result;
};

// 获取所有部门的工序状态（用于检查发货是否可以开始）
export const getAllProcessesStatusByProject = (projectId: string): {
  total: number;
  completed: number;
  canShip: boolean;
} => {
  const processes = getWorkProcessesByProjectId(projectId);
  const nonShipping = processes.filter(p => !p.isShippingProcess && p.name !== '发货');
  const completed = nonShipping.filter(p => p.status === 'completed').length;
  
  return {
    total: nonShipping.length,
    completed,
    canShip: completed === nonShipping.length
  };
};


// 获取员工的未完成任务（员工视图）- 别名
export const getEmployeeUnfinishedTasks = getEmployeePendingTasks;

// 提交日报（别名）
export const submitDailyReport = addDailyReport;

// 获取工序的日报（别名）
export const getDailyReportsByProcess = getDailyReportsByProcessId;


// 获取项目统计数据
export const getProjectStats = () => {
  const projects = getProjects();
  const processes = getWorkProcesses();
  
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const inProgress = projects.filter(p => p.status === 'in-progress').length;
  const planning = projects.filter(p => p.status === 'planning').length;
  const review = projects.filter(p => p.status === 'review').length;
  
  const totalProcesses = processes.length;
  const completedProcesses = processes.filter(p => p.status === 'completed').length;
  
  // 计算平均进度
  const averageProgress = total > 0 
    ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total 
    : 0;
  
  return {
    // 新的属性名（与Dashboard和Reports组件匹配）
    total,
    completed,
    inProgress,
    planning,
    review,
    averageProgress,
    // 保留旧的属性名以保持兼容性
    totalProjects: total,
    completedProjects: completed,
    inProgressProjects: inProgress,
    planningProjects: planning,
    totalProcesses,
    completedProcesses,
    overallProgress: totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0
  };
};
