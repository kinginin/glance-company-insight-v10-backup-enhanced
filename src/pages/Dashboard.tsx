import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { getProjectStats, getProjects, ProjectStatus } from "@/services/data";
import { getCurrentUser, getDepartmentName } from "@/services/auth";
import { useNavigate } from "react-router-dom";
import { 
  FolderKanban, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = getProjectStats();
  const projects = getProjects().slice(0, 5);
  const currentUser = getCurrentUser();

  const statusColorMap: Record<ProjectStatus, string> = {
    'planning': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-amber-100 text-amber-800',
    'review': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800'
  };

  const statusNameMap: Record<ProjectStatus, string> = {
    'planning': '规划中',
    'in-progress': '进行中',
    'review': '审核中',
    'completed': '已完成'
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          {/* 欢迎区域 */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
            <h1 className="text-2xl font-bold">
              欢迎回来，{currentUser?.username || '用户'}！
            </h1>
            <p className="mt-2 text-blue-100">
              {currentUser?.department ? `${getDepartmentName(currentUser.department)} · ` : ''}
              今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">总项目数</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <FolderKanban className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">进行中项目</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.inProgress}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <Activity className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">已完成项目</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">平均完成度</p>
                    <p className="text-3xl font-bold text-indigo-600">{Math.round(stats.averageProgress)}%</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 项目进度概览 */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">项目进度概览</h2>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/projects')}
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <Card className="mt-4 overflow-hidden shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className="rounded-lg border p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-slate-800">{project.name}</div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColorMap[project.status]}`}>
                        {statusNameMap[project.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Progress value={project.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-slate-600 w-12 text-right">{project.progress}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {project.manager}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.endDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 项目状态分布 */}
          <h2 className="mb-4 mt-8 text-xl font-bold text-slate-800">项目状态分布</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-600 font-medium">规划中</span>
                  <span className="text-xs text-blue-500 bg-blue-200 px-2 py-0.5 rounded-full">
                    {stats.total > 0 ? Math.round((stats.planning / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-4xl font-bold text-blue-700">{stats.planning}</div>
                <p className="text-sm text-blue-600 mt-1">个项目</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-600 font-medium">进行中</span>
                  <span className="text-xs text-amber-500 bg-amber-200 px-2 py-0.5 rounded-full">
                    {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-4xl font-bold text-amber-700">{stats.inProgress}</div>
                <p className="text-sm text-amber-600 mt-1">个项目</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-600 font-medium">审核中</span>
                  <span className="text-xs text-purple-500 bg-purple-200 px-2 py-0.5 rounded-full">
                    {stats.total > 0 ? Math.round((stats.review / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-4xl font-bold text-purple-700">{stats.review}</div>
                <p className="text-sm text-purple-600 mt-1">个项目</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-600 font-medium">已完成</span>
                  <span className="text-xs text-green-500 bg-green-200 px-2 py-0.5 rounded-full">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-4xl font-bold text-green-700">{stats.completed}</div>
                <p className="text-sm text-green-600 mt-1">个项目</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
