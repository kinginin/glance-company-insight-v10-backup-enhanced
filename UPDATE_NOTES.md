# 公司管理系统更新说明

## 版本信息
- 更新日期：2025-12-16
- 版本：v2.0.0

## 新增功能

### 1. 用户注册功能
- 在登录页面添加"创建账号"选项
- 注册时需要输入邀请码（默认邀请码：`admin`）
- 注册时可选择所属部门
- 支持的部门：
  - 管理员
  - 领导
  - 设计部
  - 采购部
  - 生产部
  - 装调部
  - 电气部
  - 质量部

### 2. 部门权限控制
- 管理员和领导可以访问所有部门页面
- 普通部门员工只能访问自己所属部门的页面
- 侧边栏根据用户权限动态显示可访问的部门
- 无权限访问时显示友好的提示页面

### 3. 工序部门跳转
- 在项目详情页面，每个工序都有对应的部门跳转按钮
- 点击按钮可直接跳转到对应部门查看该项目的详细信息
- 根据用户权限控制按钮的可用状态

### 4. 装调部界面（重点设计）
- **部门总览视图**：
  - 统计卡片：总任务数、进行中、已完成、平均进度
  - 部门信息：职责、负责人、团队人数、联系方式
  - 快捷操作：新建装配任务、创建发货单、物料申请、工作报告
  - 任务列表：显示所有装配和发货任务
- **项目详情视图**：
  - 装配工序卡片：显示装配进度和状态
  - 发货工序卡片：显示发货准备状态
  - 装配清单：详细的装配项目、物料需求、状态和负责人
- **标签页导航**：
  - 任务总览：所有任务的综合视图
  - 装配任务：专门的装配任务列表
  - 发货管理：发货和物流跟踪

### 5. 其他部门页面
所有部门页面都已更新为统一风格，包括：
- 设计部
- 采购部
- 生产部
- 电气部
- 质量部

每个部门页面都支持：
- 部门总览视图
- 项目关联视图（通过工序跳转访问）
- 统计数据展示
- 任务列表

## 界面优化

### 登录页面
- 新增注册表单切换
- 美化表单样式
- 添加部门选择下拉框

### 仪表盘
- 添加欢迎区域，显示用户名和部门
- 美化统计卡片，添加图标
- 项目列表支持点击跳转
- 优化项目状态分布展示

### 侧边栏
- 添加部门导航区域
- 根据用户权限动态显示部门链接
- 美化导航项样式

### 导航栏
- 显示当前用户信息
- 显示用户所属部门
- 优化用户菜单样式

## 技术改进

### 新增组件
- `DepartmentGuard.tsx`：部门权限守卫组件，用于保护部门页面

### 服务扩展（auth.ts）
- `register()`：用户注册函数
- `validateInviteCode()`：邀请码验证
- `canAccessDepartment()`：部门访问权限检查
- `isAdminOrLeader()`：管理员/领导身份检查
- `getAccessibleDepartments()`：获取可访问部门列表
- `getDepartmentName()`：获取部门中文名称

### 数据结构
- User 类型新增 `department` 字段
- 新增 `Department` 类型定义
- 新增部门名称和路由映射

## 使用说明

### 登录系统
1. 默认管理员账号：用户名 `admin`，密码 `admin`
2. 默认领导账号：用户名 `leader`，密码 `leader`

### 注册新账号
1. 在登录页面点击"创建账号"
2. 输入用户名、密码、姓名
3. 选择所属部门
4. 输入邀请码：`admin`
5. 点击"注册"完成创建

### 访问部门页面
1. 管理员/领导：可通过侧边栏访问所有部门
2. 普通员工：只能访问自己所属部门
3. 也可通过项目详情页的工序跳转按钮访问

## 文件变更列表

### 新增文件
- `src/components/DepartmentGuard.tsx`

### 修改文件
- `src/services/auth.ts`
- `src/pages/Login.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/pages/WorkProcess.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Navbar.tsx`
- `src/pages/departments/AssemblyDepartment.tsx`
- `src/pages/departments/DesignDepartment.tsx`
- `src/pages/departments/ProcurementDepartment.tsx`
- `src/pages/departments/ProductionDepartment.tsx`
- `src/pages/departments/ElectricalDepartment.tsx`
- `src/pages/departments/QualityDepartment.tsx`

## 后续建议

1. **数据持久化**：当前使用 localStorage 存储数据，建议接入后端数据库
2. **权限细化**：可以进一步细化权限控制，如只读、编辑等
3. **通知系统**：添加任务分配和进度更新的通知功能
4. **报表导出**：添加数据导出功能
5. **移动端适配**：优化移动端显示效果
