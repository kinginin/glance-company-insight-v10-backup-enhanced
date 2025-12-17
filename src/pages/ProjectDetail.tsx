import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Label } from "@/components/ui/label";
import { 
  getProjectById, 
  getWorkProcessesByProjectId, 
  Project, 
  WorkProcess, 
  ProjectStatus,
  getDailyReportsByProcess
} from "@/services/data";
import { canAccessDepartment, Department, getUsers } from "@/services/auth";
import { 
  ChevronLeft, 
  Calendar, 
  Users, 
  AlertCircle, 
  Eye, 
  Building2,
  Clock,
  User,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// 工序名称到部门的映射
const processNameToDepartment: Record<string, { route: string; department: Department }> = {
  '设计': { route: '/departments/design', department: 'design' },
  '采购': { route: '/departments/procurement', department: 'procurement' },
  '加工': { route: '/departments/production', department: 'production' },
  '装配': { route: '/departments/assembly', department: 'assembly' },
  '调试': { route: '/departments/electrical', department: 'electrical' },
  '检验': { route: '/departments/quality', department: 'quality' },
  '发货': { route: '/departments/assembly', department: 'assembly' },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [workProcesses, setWorkProcesses] = useState<WorkProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<WorkProcess | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const projectData = getProjectById(id);
      if (projectData) {
        setProject(projectData);
        setWorkProcesses(getWorkProcessesByProjectId(id));
      } else {
        navigate("/projects");
      }
    }
  }, [id, navigate]);

  // 获取用户显示名称
  const getUserName = (username: string) => {
    const users = getUsers();
    const user = users.find(u => u.username === username);
    return user?.fullName || username || '未分配';
  };

  // 打开工序详情弹窗
  const openProcessDialog = (process: WorkProcess) => {
    setSelectedProcess(process);
    setProcessDialogOpen(true);
  };

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  // 项目状态对应的颜色
  const statusColorMap: Record<ProjectStatus, string> = {
    'planning': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-amber-100 text-amber-800',
    'review': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800'
  };

  // 项目状态翻译
  const statusNameMap: Record<ProjectStatus, string> = {
    'planning': '规划中',
    'in-progress': '进行中',
    'review': '审核中',
    'completed': '已完成'
  };

  // 工序状态颜色
  const processStatusColors: Record<string, string> = {
    'pending': 'bg-gray-100 text-gray-800',
    'waiting': 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800'
  };

  // 工序状态名称
  const processStatusNames: Record<string, string> = {
    'pending': '待分配',
    'waiting': '等待中',
    'in-progress': '进行中',
    'completed': '已完成'
  };

  // 计算工作工序进度
  const completedProcesses = workProcesses.filter((p) => p.status === 'completed').length;
  const processProgress = workProcesses.length > 0 ? Math.round((completedProcesses / workProcesses.length) * 100) : 0;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center">
            <Button variant="ghost" onClick={() => navigate("/projects")} className="mr-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回项目列表
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
            <Badge className={`ml-4 ${statusColorMap[project.status]}`}>
              {statusNameMap[project.status]}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* 项目详情 */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>项目详情</CardTitle>
                <CardDescription>项目的基本信息和当前进度</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-medium">项目描述</h3>
                  <p className="text-slate-600">{project.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <div className="text-sm text-slate-500">开始日期</div>
                      <div>{project.startDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <div className="text-sm text-slate-500">预计完成日期</div>
                      <div>{project.endDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-slate-500" />
                    <div>
                      <div className="text-sm text-slate-500">项目负责人</div>
                      <div>{project.projectManager}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 项目进度 */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>项目进度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">总体完成度</h3>
                    <span className="text-lg font-bold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">工序完成度</h3>
                    <span className="text-lg font-bold">{processProgress}%</span>
                  </div>
                  <Progress value={processProgress} className="h-2" />
                  <p className="text-sm text-slate-500">
                    {completedProcesses} / {workProcesses.length} 个工序已完成
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                    <div>
                      <h3 className="font-medium text-amber-800">项目状态</h3>
                      <p className="text-sm text-amber-700">
                        项目当前{statusNameMap[project.status]}，
                        {project.status === 'completed' 
                          ? '所有工作已完成' 
                          : '请继续关注项目进展'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 工作工序 */}
          <h2 className="mb-4 mt-8 text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            工作工序
          </h2>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {workProcesses.map((process, index) => {
                  return (
                    <div key={process.id}>
                      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-medium
                            ${process.status === 'completed' ? 'bg-green-500' : 
                              process.status === 'in-progress' ? 'bg-blue-500' : 
                              process.status === 'waiting' ? 'bg-yellow-500' : 'bg-slate-300'}`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-lg">{process.name}</h3>
                            <Badge className={processStatusColors[process.status] || processStatusColors['pending']}>
                              {processStatusNames[process.status] || '待分配'}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-3">{process.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <span className="text-slate-500">
                                <Clock className="inline h-4 w-4 mr-1" />
                                计划: {process.plannedDays || process.duration} 天
                              </span>
                              <span className="text-slate-500">
                                <Building2 className="inline h-4 w-4 mr-1" />
                                {process.department}
                              </span>
                              {process.mainEmployeeId && (
                                <span className="text-slate-500">
                                  <User className="inline h-4 w-4 mr-1" />
                                  负责人: {getUserName(process.mainEmployeeId)}
                                </span>
                              )}
                            </div>
                            {/* 查看项目信息按钮 */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => openProcessDialog(process)}
                            >
                              <Eye className="h-4 w-4" />
                              查看项目信息
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < workProcesses.length - 1 && (
                        <div className="ml-5 mt-2 border-l-2 border-dashed border-slate-200 h-4"></div>
                      )}
                    </div>
                  );
                })}
                {workProcesses.length === 0 && (
                  <div className="py-8 text-center text-slate-500">该项目暂无工作工序</div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* 工序详情弹窗 */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              工序详情 - {selectedProcess?.name}
            </DialogTitle>
            <DialogDescription>
              {project?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcess && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">项目名称</Label>
                  <p className="font-medium">{project?.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">工序名称</Label>
                  <p className="font-medium">{selectedProcess.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">所属部门</Label>
                  <p className="font-medium">{selectedProcess.department}</p>
                </div>
                <div>
                  <Label className="text-slate-500">当前状态</Label>
                  <Badge className={processStatusColors[selectedProcess.status] || processStatusColors['pending']}>
                    {processStatusNames[selectedProcess.status] || '待分配'}
                  </Badge>
                </div>
              </div>

              {/* 人员信息 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  人员分配
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">部门经理</Label>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4 text-blue-500" />
                      {selectedProcess.managerId ? getUserName(selectedProcess.managerId) : '未指定'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">主要负责人</Label>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4 text-green-500" />
                      {selectedProcess.mainEmployeeId ? getUserName(selectedProcess.mainEmployeeId) : '未分配'}
                    </p>
                  </div>
                </div>
                {selectedProcess.assistantIds && selectedProcess.assistantIds.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-slate-500">辅助人员</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedProcess.assistantIds.map((id, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          {getUserName(id)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 时间信息 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  时间安排
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500">预计工序时间</Label>
                    <p className="font-medium">{selectedProcess.plannedDays || selectedProcess.duration} 天</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">计划时间段</Label>
                    <p className="font-medium">
                      {selectedProcess.plannedStartDate || '-'} ~ {selectedProcess.plannedEndDate || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">工序开始时间</Label>
                    <p className="font-medium flex items-center gap-1">
                      {selectedProcess.actualStartDate ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {selectedProcess.actualStartDate}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-slate-400" />
                          未开始
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-500">工序结束时间</Label>
                    <p className="font-medium flex items-center gap-1">
                      {selectedProcess.actualEndDate ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {selectedProcess.actualEndDate}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-slate-400" />
                          未完成
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {selectedProcess.actualDays && (
                  <div className="mt-3">
                    <Label className="text-slate-500">实际用时</Label>
                    <p className="font-medium">{selectedProcess.actualDays} 天</p>
                  </div>
                )}
              </div>

              {/* 工作记录 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  工作记录
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {getDailyReportsByProcess(selectedProcess.id).map(report => (
                    <div key={report.id} className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm text-slate-500 mb-1">
                        <span>{getUserName(report.employeeId)}</span>
                        <span>{report.date}</span>
                      </div>
                      <p className="text-sm">{report.content}</p>
                      {report.feedback && (
                        <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          问题反馈：{report.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                  {getDailyReportsByProcess(selectedProcess.id).length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">暂无工作记录</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
