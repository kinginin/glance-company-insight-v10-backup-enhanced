import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProjects, ProjectStatus, Project, createProject, deleteProject, standardWorkProcesses, ProcessPlan } from "@/services/data";
import { isAdmin, getCurrentUser } from "@/services/auth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Plus, Calendar, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Projects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<Project[]>(getProjects());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser] = useState(getCurrentUser());
  const [canCreate] = useState(isAdmin());
  
  // 新项目数据
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    description: "",
    projectManager: "",
    startDate: "",
    endDate: ""
  });
  
  // 工序规划数据（开始时间 + 所需天数）
  const [processPlans, setProcessPlans] = useState<{startDate: string; days: number}[]>(
    standardWorkProcesses.map(() => ({ startDate: "", days: 7 }))
  );
  
  // 当项目开始日期变化时，自动设置工序开始日期
  useEffect(() => {
    if (newProjectData.startDate) {
      setProcessPlans(prev => prev.map((plan, index) => {
        // 如果还没设置开始日期，默认使用项目开始日期
        if (!plan.startDate) {
          return { ...plan, startDate: newProjectData.startDate };
        }
        return plan;
      }));
    }
  }, [newProjectData.startDate]);
  
  // 计算项目天数
  const getProjectDays = () => {
    if (!newProjectData.startDate || !newProjectData.endDate) return 0;
    const start = new Date(newProjectData.startDate);
    const end = new Date(newProjectData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };
  
  const projectDays = getProjectDays();
  
  // 验证工序时间
  const validateProcessPlans = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const projectStart = new Date(newProjectData.startDate);
    const projectEnd = new Date(newProjectData.endDate);
    
    processPlans.forEach((plan, index) => {
      const processName = standardWorkProcesses[index].name;
      
      if (!plan.startDate) {
        errors.push(`${processName}工序未设置开始时间`);
        return;
      }
      
      const startDate = new Date(plan.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.days - 1);
      
      if (startDate < projectStart) {
        errors.push(`${processName}工序开始时间不能早于项目开始时间`);
      }
      
      if (endDate > projectEnd) {
        errors.push(`${processName}工序结束时间(${endDate.toLocaleDateString()})超过项目结束时间`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  // 项目状态对应的颜色
  const statusColorMap: Record<ProjectStatus, string> = {
    'planning': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'in-progress': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    'review': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    'completed': 'bg-green-100 text-green-800 hover:bg-green-200'
  };

  // 项目状态翻译
  const statusNameMap: Record<ProjectStatus, string> = {
    'planning': '规划中',
    'in-progress': '进行中',
    'review': '审核中',
    'completed': '已完成'
  };

  // 过滤项目
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectManager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 创建新项目
  const handleCreateProject = () => {
    if (!newProjectData.name || !newProjectData.projectManager || 
        !newProjectData.startDate || !newProjectData.endDate) {
      toast({
        title: "请填写所有必填字段",
        variant: "destructive"
      });
      return;
    }
    
    const validation = validateProcessPlans();
    if (!validation.valid) {
      toast({
        title: "工序时间规划有误",
        description: validation.errors[0],
        variant: "destructive"
      });
      return;
    }

    // 构建工序规划数据
    const plans: ProcessPlan[] = standardWorkProcesses.map((process, index) => ({
      name: process.name,
      department: process.department,
      description: process.description,
      startDate: processPlans[index].startDate,
      days: processPlans[index].days,
      isShipping: process.isShipping
    }));

    const project = createProject(
      newProjectData.name,
      newProjectData.description,
      newProjectData.projectManager,
      newProjectData.startDate,
      newProjectData.endDate,
      plans
    );

    if (project) {
      setProjects(getProjects());
      setIsDialogOpen(false);
      setNewProjectData({
        name: "",
        description: "",
        projectManager: "",
        startDate: "",
        endDate: ""
      });
      setProcessPlans(standardWorkProcesses.map(() => ({ startDate: "", days: 7 })));

      toast({
        title: "项目创建成功",
        description: `项目"${project.name}"已成功创建，等待各部门经理分配任务`
      });
    } else {
      toast({
        title: "创建失败",
        description: "只有管理员可以创建项目",
        variant: "destructive"
      });
    }
  };

  // 删除项目
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    
    if (!canCreate) {
      toast({
        title: "权限不足",
        description: "只有管理员可以删除项目",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm("确定要删除此项目吗？此操作不可恢复。")) {
      deleteProject(projectId);
      setProjects(getProjects());
      toast({
        title: "项目已删除",
        description: "项目及其相关工序已成功删除"
      });
    }
  };

  // 按状态过滤项目
  const getProjectsByStatus = (status: ProjectStatus | 'all') => {
    return status === 'all' 
      ? filteredProjects 
      : filteredProjects.filter(project => project.status === status);
  };

  // 查看项目详情
  const viewProjectDetail = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };
  
  // 更新工序规划
  const updateProcessPlan = (index: number, field: 'startDate' | 'days', value: string | number) => {
    const newPlans = [...processPlans];
    if (field === 'startDate') {
      newPlans[index] = { ...newPlans[index], startDate: value as string };
    } else {
      newPlans[index] = { ...newPlans[index], days: Math.max(1, value as number) };
    }
    setProcessPlans(newPlans);
  };
  
  // 计算工序结束日期
  const getProcessEndDate = (startDate: string, days: number): string => {
    if (!startDate) return '-';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    return end.toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800">项目管理</h1>
            
            {/* 只有管理员可以看到创建按钮 */}
            {canCreate && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    创建新项目
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>创建新项目</DialogTitle>
                    <DialogDescription>
                      填写项目基本信息并为各工序设置独立的开始时间和所需天数
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* 基本信息 */}
                    <div className="grid gap-2">
                      <Label htmlFor="name">项目名称 *</Label>
                      <Input
                        id="name"
                        value={newProjectData.name}
                        onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                        placeholder="输入项目名称"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">项目描述</Label>
                      <Textarea
                        id="description"
                        value={newProjectData.description}
                        onChange={(e) => setNewProjectData({...newProjectData, description: e.target.value})}
                        placeholder="输入项目描述"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="projectManager">项目负责人 *</Label>
                      <Input
                        id="projectManager"
                        value={newProjectData.projectManager}
                        onChange={(e) => setNewProjectData({...newProjectData, projectManager: e.target.value})}
                        placeholder="输入项目负责人姓名"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          项目开始日期 *
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newProjectData.startDate}
                          onChange={(e) => setNewProjectData({...newProjectData, startDate: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endDate">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          项目结束日期 *
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newProjectData.endDate}
                          min={newProjectData.startDate}
                          onChange={(e) => setNewProjectData({...newProjectData, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    {/* 项目周期提示 */}
                    {projectDays > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-sm text-blue-700">
                          项目周期：<strong>{projectDays}</strong> 天
                          （{newProjectData.startDate} 至 {newProjectData.endDate}）
                        </span>
                      </div>
                    )}
                    
                    {/* 工序时间规划说明 */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>工序规划说明：</strong>各部门工序可以并行执行，只有"发货"工序需要等待其他所有工序完成后才能开始。
                        请为每个工序设置独立的开始时间和所需天数。
                      </AlertDescription>
                    </Alert>
                    
                    {/* 工序时间规划 */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        工序时间规划
                      </h4>
                      <div className="space-y-4">
                        {standardWorkProcesses.map((process, index) => {
                          const isShipping = process.isShipping;
                          const endDate = getProcessEndDate(processPlans[index].startDate, processPlans[index].days);
                          const projectEnd = newProjectData.endDate ? new Date(newProjectData.endDate) : null;
                          const processEnd = processPlans[index].startDate 
                            ? new Date(new Date(processPlans[index].startDate).getTime() + (processPlans[index].days - 1) * 24 * 60 * 60 * 1000)
                            : null;
                          const isOverdue = projectEnd && processEnd && processEnd > projectEnd;
                          
                          return (
                            <div key={index} className={`p-3 rounded-lg ${isShipping ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-medium">{process.name}</span>
                                  <span className="text-sm text-slate-500 ml-2">
                                    ({process.description})
                                  </span>
                                  {isShipping && (
                                    <Badge className="ml-2 bg-amber-100 text-amber-800">
                                      需等待其他工序完成
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <div>
                                  <Label className="text-xs text-slate-500">开始时间</Label>
                                  <Input
                                    type="date"
                                    value={processPlans[index].startDate}
                                    min={newProjectData.startDate}
                                    max={newProjectData.endDate}
                                    onChange={(e) => updateProcessPlan(index, 'startDate', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500">所需天数</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={processPlans[index].days}
                                      onChange={(e) => updateProcessPlan(index, 'days', parseInt(e.target.value) || 1)}
                                      className="w-20 text-center"
                                    />
                                    <span className="text-sm text-slate-500">天</span>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500">预计结束</Label>
                                  <div className={`mt-1 p-2 rounded text-sm ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                                    {endDate}
                                    {isOverdue && <span className="ml-1">⚠️</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateProject}>
                      创建项目
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="搜索项目名称、描述或负责人"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-6 grid w-full grid-cols-5">
              <TabsTrigger value="all">全部项目</TabsTrigger>
              <TabsTrigger value="planning">规划中</TabsTrigger>
              <TabsTrigger value="in-progress">进行中</TabsTrigger>
              <TabsTrigger value="review">审核中</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
            </TabsList>

            {(['all', 'planning', 'in-progress', 'review', 'completed'] as const).map(status => (
              <TabsContent key={status} value={status}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{status === 'all' ? '所有项目' : `${statusNameMap[status]}项目`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>项目负责人</TableHead>
                          <TableHead>开始日期</TableHead>
                          <TableHead>结束日期</TableHead>
                          <TableHead className="text-right">进度</TableHead>
                          {canCreate && <TableHead className="text-right">操作</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getProjectsByStatus(status).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={canCreate ? 7 : 6} className="text-center text-slate-500 py-8">
                              暂无项目
                            </TableCell>
                          </TableRow>
                        ) : (
                          getProjectsByStatus(status).map((project) => (
                            <TableRow
                              key={project.id}
                              className="cursor-pointer hover:bg-slate-50"
                              onClick={() => viewProjectDetail(project.id)}
                            >
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell>
                                <Badge className={statusColorMap[project.status]}>
                                  {statusNameMap[project.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>{project.projectManager}</TableCell>
                              <TableCell>{project.startDate}</TableCell>
                              <TableCell>{project.endDate}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Progress value={project.progress} className="w-16 h-2" />
                                  <span className="text-sm">{project.progress}%</span>
                                </div>
                              </TableCell>
                              {canCreate && (
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
