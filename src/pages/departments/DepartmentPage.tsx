import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Department, 
  getCurrentUser, 
  getDepartmentEmployees, 
  getDepartmentName,
  isManager,
  isAdminOrLeader,
  getUsers,
  User
} from "@/services/auth";
import {
  Project,
  WorkProcess,
  DailyReport,
  ProjectWithProcess,
  getDepartmentUnassignedProjects,
  getDepartmentInProgressProjects,
  getDepartmentCompletedProjects,
  getEmployeeUnfinishedTasks,
  getEmployeeCompletedTasks,
  assignProcessToEmployee,
  completeProcess,
  submitDailyReport,
  getDailyReportsByProcess,
  getProjectById
} from "@/services/data";
import { DepartmentGuard } from "@/components/DepartmentGuard";
import { toast } from "@/hooks/use-toast";
import { 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  Users, 
  Plus, 
  Send,
  FileText,
  AlertCircle,
  Calendar
} from "lucide-react";

interface DepartmentPageProps {
  department: Department;
  title: string;
  description: string;
}

export default function DepartmentPage({ department, title, description }: DepartmentPageProps) {
  const [currentUser] = useState(getCurrentUser());
  const [isManagerView, setIsManagerView] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 经理视图数据
  const [unassignedProjects, setUnassignedProjects] = useState<ProjectWithProcess[]>([]);
  const [inProgressProjects, setInProgressProjects] = useState<ProjectWithProcess[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectWithProcess[]>([]);
  
  // 员工视图数据
  const [myUnfinishedTasks, setMyUnfinishedTasks] = useState<ProjectWithProcess[]>([]);
  const [myCompletedTasks, setMyCompletedTasks] = useState<ProjectWithProcess[]>([]);
  
  // 弹窗状态
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<WorkProcess | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // 分配表单
  const [mainEmployee, setMainEmployee] = useState("");
  const [assistants, setAssistants] = useState<string[]>([]);
  
  // 日报表单
  const [reportContent, setReportContent] = useState("");
  const [reportFeedback, setReportFeedback] = useState("");
  
  // 部门员工列表
  const [departmentEmployees, setDepartmentEmployees] = useState<User[]>([]);
  
  useEffect(() => {
    if (currentUser) {
      // 判断是否显示经理视图
      const showManagerView = currentUser.role === 'admin' || 
                              currentUser.role === 'leader' ||
                              currentUser.role === 'manager' ||
                              currentUser.role === 'deputy_manager';
      setIsManagerView(showManagerView);
      
      // 加载部门员工
      setDepartmentEmployees(getDepartmentEmployees(department));
      
      // 加载数据
      refreshData();
    }
  }, [currentUser, department, refreshKey]);
  
  const refreshData = () => {
    // 经理视图数据
    setUnassignedProjects(getDepartmentUnassignedProjects(department));
    setInProgressProjects(getDepartmentInProgressProjects(department));
    setCompletedProjects(getDepartmentCompletedProjects(department));
    
    // 员工视图数据
    if (currentUser) {
      setMyUnfinishedTasks(getEmployeeUnfinishedTasks(currentUser.username));
      setMyCompletedTasks(getEmployeeCompletedTasks(currentUser.username));
    }
  };
  
  // 打开分配弹窗
  const openAssignDialog = (project: Project, process: WorkProcess) => {
    setSelectedProject(project);
    setSelectedProcess(process);
    setMainEmployee("");
    setAssistants([]);
    setAssignDialogOpen(true);
  };
  
  // 打开任务详情弹窗
  const openTaskDialog = (project: Project, process: WorkProcess) => {
    setSelectedProject(project);
    setSelectedProcess(process);
    setTaskDialogOpen(true);
  };
  
  // 打开日报弹窗
  const openReportDialog = (project: Project, process: WorkProcess) => {
    setSelectedProject(project);
    setSelectedProcess(process);
    setReportContent("");
    setReportFeedback("");
    setReportDialogOpen(true);
  };
  
  // 分配任务
  const handleAssign = () => {
    if (!selectedProcess || !mainEmployee) {
      toast({
        title: "请选择主要负责人",
        variant: "destructive"
      });
      return;
    }
    
    const success = assignProcessToEmployee(
      selectedProcess.id,
      mainEmployee,
      assistants.filter(a => a !== "")
    );
    
    if (success) {
      toast({
        title: "分配成功",
        description: "任务已分配给选定的员工"
      });
      setAssignDialogOpen(false);
      setRefreshKey(k => k + 1);
    } else {
      toast({
        title: "分配失败",
        description: "请检查权限或重试",
        variant: "destructive"
      });
    }
  };
  
  // 添加辅助人员
  const addAssistant = () => {
    setAssistants([...assistants, ""]);
  };
  
  // 更新辅助人员
  const updateAssistant = (index: number, value: string) => {
    const newAssistants = [...assistants];
    newAssistants[index] = value;
    setAssistants(newAssistants);
  };
  
  // 移除辅助人员
  const removeAssistant = (index: number) => {
    setAssistants(assistants.filter((_, i) => i !== index));
  };
  
  // 提交日报
  const handleSubmitReport = () => {
    if (!selectedProcess || !reportContent.trim()) {
      toast({
        title: "请填写项目情况",
        variant: "destructive"
      });
      return;
    }
    
    const report = submitDailyReport(
      selectedProcess.id,
      reportContent,
      reportFeedback || undefined
    );
    
    if (report) {
      toast({
        title: "日报提交成功"
      });
      setReportDialogOpen(false);
    } else {
      toast({
        title: "提交失败",
        variant: "destructive"
      });
    }
  };
  
  // 完成任务
  const handleCompleteTask = () => {
    if (!selectedProcess) return;
    
    if (confirm("确定要提交完成此工序吗？")) {
      const success = completeProcess(selectedProcess.id);
      
      if (success) {
        toast({
          title: "工序已完成",
          description: "任务已标记为完成"
        });
        setTaskDialogOpen(false);
        setRefreshKey(k => k + 1);
      } else {
        toast({
          title: "操作失败",
          variant: "destructive"
        });
      }
    }
  };
  
  // 获取用户显示名称
  const getUserName = (username: string) => {
    const users = getUsers();
    const user = users.find(u => u.username === username);
    return user?.fullName || username;
  };
  
  // 状态颜色
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'waiting': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    const names: Record<string, string> = {
      'pending': '待分配',
      'waiting': '等待中',
      'in-progress': '进行中',
      'completed': '已完成'
    };
    return <Badge className={colors[status] || colors['pending']}>{names[status] || status}</Badge>;
  };

  return (
    <DepartmentGuard department={department}>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-auto p-6">
            {/* 页面标题 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              <p className="text-slate-600 mt-1">{description}</p>
            </div>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {isManagerView ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">未分配项目</CardTitle>
                      <FolderOpen className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{unassignedProjects.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">进行中项目</CardTitle>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{inProgressProjects.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">已完成项目</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{completedProjects.length}</div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">我的待办任务</CardTitle>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{myUnfinishedTasks.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">已完成任务</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{myCompletedTasks.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">部门成员</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{departmentEmployees.length}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            
            {/* 主内容区 */}
            {isManagerView ? (
              /* 经理视图 */
              <Tabs defaultValue="unassigned">
                <TabsList className="mb-4">
                  <TabsTrigger value="unassigned" className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    未分配项目
                    {unassignedProjects.length > 0 && (
                      <Badge variant="secondary">{unassignedProjects.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="in-progress" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    进行中项目
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    已完成项目
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="unassigned">
                  <Card>
                    <CardHeader>
                      <CardTitle>待分配项目</CardTitle>
                      <CardDescription>点击项目进行任务分配</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {unassignedProjects.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>暂无待分配项目</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>项目名称</TableHead>
                              <TableHead>工序</TableHead>
                              <TableHead>项目负责人</TableHead>
                              <TableHead>计划时间</TableHead>
                              <TableHead>计划天数</TableHead>
                              <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unassignedProjects.map(({ project, process }) => (
                              <TableRow key={process.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell>{process.name}</TableCell>
                                <TableCell>{project.projectManager}</TableCell>
                                <TableCell>
                                  {process.plannedStartDate} ~ {process.plannedEndDate}
                                </TableCell>
                                <TableCell>{process.plannedDays} 天</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    size="sm"
                                    onClick={() => openAssignDialog(project, process)}
                                  >
                                    <Users className="h-4 w-4 mr-1" />
                                    分配
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="in-progress">
                  <Card>
                    <CardHeader>
                      <CardTitle>进行中项目</CardTitle>
                      <CardDescription>查看项目进度和员工反馈</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {inProgressProjects.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>暂无进行中项目</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>项目名称</TableHead>
                              <TableHead>工序</TableHead>
                              <TableHead>主要负责人</TableHead>
                              <TableHead>状态</TableHead>
                              <TableHead>开始时间</TableHead>
                              <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inProgressProjects.map(({ project, process }) => (
                              <TableRow key={process.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell>{process.name}</TableCell>
                                <TableCell>{getUserName(process.mainEmployeeId || '')}</TableCell>
                                <TableCell>{getStatusBadge(process.status)}</TableCell>
                                <TableCell>{process.actualStartDate || '-'}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openTaskDialog(project, process)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    详情
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="completed">
                  <Card>
                    <CardHeader>
                      <CardTitle>已完成项目</CardTitle>
                      <CardDescription>本部门已完成的工序</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {completedProjects.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>暂无已完成项目</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>项目名称</TableHead>
                              <TableHead>工序</TableHead>
                              <TableHead>负责人</TableHead>
                              <TableHead>完成时间</TableHead>
                              <TableHead>实际天数</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedProjects.map(({ project, process }) => (
                              <TableRow key={process.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell>{process.name}</TableCell>
                                <TableCell>{getUserName(process.mainEmployeeId || '')}</TableCell>
                                <TableCell>{process.actualEndDate || '-'}</TableCell>
                                <TableCell>{process.actualDays || '-'} 天</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              /* 员工视图 */
              <Tabs defaultValue="unfinished">
                <TabsList className="mb-4">
                  <TabsTrigger value="unfinished" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    未完成任务
                    {myUnfinishedTasks.length > 0 && (
                      <Badge variant="secondary">{myUnfinishedTasks.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    已完成任务
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="unfinished">
                  <Card>
                    <CardHeader>
                      <CardTitle>我的待办任务</CardTitle>
                      <CardDescription>需要完成的工作任务</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {myUnfinishedTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>暂无待办任务</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {myUnfinishedTasks.map(({ project, process }) => (
                            <Card key={process.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{project.name}</h4>
                                    <p className="text-sm text-slate-600">工序：{process.name}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                      <span className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {process.plannedStartDate} ~ {process.plannedEndDate}
                                      </span>
                                      <span>计划 {process.plannedDays} 天</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => openReportDialog(project, process)}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      填写日报
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => openTaskDialog(project, process)}
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      提交完成
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="completed">
                  <Card>
                    <CardHeader>
                      <CardTitle>已完成任务</CardTitle>
                      <CardDescription>我已完成的工作任务</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {myCompletedTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>暂无已完成任务</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>项目名称</TableHead>
                              <TableHead>工序</TableHead>
                              <TableHead>完成时间</TableHead>
                              <TableHead>实际天数</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {myCompletedTasks.map(({ project, process }) => (
                              <TableRow key={process.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell>{process.name}</TableCell>
                                <TableCell>{process.actualEndDate || '-'}</TableCell>
                                <TableCell>{process.actualDays || '-'} 天</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </div>
      
      {/* 分配任务弹窗 */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>分配任务</DialogTitle>
            <DialogDescription>
              为 "{selectedProject?.name}" 的 "{selectedProcess?.name}" 工序分配负责人
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>主要负责人 *</Label>
              <Select value={mainEmployee} onValueChange={setMainEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="选择主要负责人" />
                </SelectTrigger>
                <SelectContent>
                  {departmentEmployees.map(emp => (
                    <SelectItem key={emp.username} value={emp.username}>
                      {emp.fullName} ({emp.role === 'manager' ? '经理' : emp.role === 'deputy_manager' ? '副经理' : '员工'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>辅助人员</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAssistant}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </div>
              {assistants.map((assistant, index) => (
                <div key={index} className="flex gap-2">
                  <Select value={assistant} onValueChange={(v) => updateAssistant(index, v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择辅助人员" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentEmployees
                        .filter(emp => emp.username !== mainEmployee && !assistants.includes(emp.username))
                        .map(emp => (
                          <SelectItem key={emp.username} value={emp.username}>
                            {emp.fullName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeAssistant(index)}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAssign}>
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 任务详情/完成弹窗 */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
          </DialogHeader>
          {selectedProject && selectedProcess && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">项目名称</Label>
                  <p className="font-medium">{selectedProject.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">工序</Label>
                  <p className="font-medium">{selectedProcess.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">主要负责人</Label>
                  <p className="font-medium">{getUserName(selectedProcess.mainEmployeeId || '')}</p>
                </div>
                <div>
                  <Label className="text-slate-500">辅助人员</Label>
                  <p className="font-medium">
                    {selectedProcess.assistantIds?.map(id => getUserName(id)).join(', ') || '无'}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">计划时间</Label>
                  <p className="font-medium">
                    {selectedProcess.plannedStartDate} ~ {selectedProcess.plannedEndDate}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">状态</Label>
                  <p>{getStatusBadge(selectedProcess.status)}</p>
                </div>
              </div>
              
              {/* 日报记录 */}
              <div>
                <Label className="text-slate-500">工作记录</Label>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                  {getDailyReportsByProcess(selectedProcess.id).map(report => (
                    <div key={report.id} className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm text-slate-500 mb-1">
                        <span>{getUserName(report.employeeId)}</span>
                        <span>{report.date}</span>
                      </div>
                      <p className="text-sm">{report.content}</p>
                      {report.feedback && (
                        <p className="text-sm text-orange-600 mt-1">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {report.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                  {getDailyReportsByProcess(selectedProcess.id).length === 0 && (
                    <p className="text-slate-500 text-sm">暂无工作记录</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              关闭
            </Button>
            {selectedProcess?.status === 'in-progress' && (
              <Button onClick={handleCompleteTask} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-1" />
                完成工序
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 日报弹窗 */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>填写工作日报</DialogTitle>
            <DialogDescription>
              {selectedProject?.name} - {selectedProcess?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>项目情况 *</Label>
              <Textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="请填写今日工作进展..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>问题反馈（可选）</Label>
              <Textarea
                value={reportFeedback}
                onChange={(e) => setReportFeedback(e.target.value)}
                placeholder="如有问题或需要协调的事项请填写..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitReport}>
              提交日报
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DepartmentGuard>
  );
}
