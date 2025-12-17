import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { getProjects, getWorkProcesses, standardWorkProcesses } from "@/services/data";
import { canAccessDepartment, Department } from "@/services/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Clock, Users, ArrowRight, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 部门到路由的映射
const departmentRouteMap: Record<string, { route: string; department: Department }> = {
  '设计部': { route: '/departments/design', department: 'design' },
  '采购部': { route: '/departments/procurement', department: 'procurement' },
  '生产部': { route: '/departments/production', department: 'production' },
  '装调部': { route: '/departments/assembly', department: 'assembly' },
  '电气部': { route: '/departments/electrical', department: 'electrical' },
  '检验部': { route: '/departments/quality', department: 'quality' },
};

export default function WorkProcess() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const projects = getProjects();
  const workProcesses = getWorkProcesses();
  const navigate = useNavigate();
  
  // 根据选择的项目过滤工序
  const filteredProcesses = selectedProject === "all" 
    ? standardWorkProcesses.map((process, index) => ({
        id: `standard-${index}`,
        projectId: 'all',
        name: process.name,
        description: process.description,
        order: index + 1,
        duration: process.duration,
        status: 'pending' as const,
        department: process.department,
        manager: process.manager
      }))
    : workProcesses.filter(p => p.projectId === selectedProject);

  // 处理部门跳转
  const handleDepartmentClick = (departmentName: string, projectId?: string) => {
    const mapping = departmentRouteMap[departmentName];
    if (mapping) {
      // 检查权限
      if (!canAccessDepartment(mapping.department)) {
        return; // 权限检查会在DepartmentGuard中处理
      }
      const route = projectId && projectId !== 'all' 
        ? `${mapping.route}/${projectId}` 
        : mapping.route;
      navigate(route);
    }
  };

  // 检查是否可以访问某个部门
  const canAccess = (departmentName: string): boolean => {
    const mapping = departmentRouteMap[departmentName];
    return mapping ? canAccessDepartment(mapping.department) : false;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800">工作工序管理</h1>
          </div>
          
          {/* 项目工序列表 */}
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  项目工序列表
                </CardTitle>
                <div className="w-[200px]">
                  <Select 
                    value={selectedProject}
                    onValueChange={(value) => setSelectedProject(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有项目（标准工序）</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[80px]">序号</TableHead>
                    <TableHead className="w-[120px]">工序名称</TableHead>
                    <TableHead className="w-[120px]">负责部门</TableHead>
                    <TableHead>工作内容</TableHead>
                    <TableHead className="w-[100px]">负责人</TableHead>
                    <TableHead className="w-[120px] text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesses.map((process) => {
                    const hasAccess = canAccess(process.department || '');
                    return (
                      <TableRow key={process.id} className="hover:bg-slate-50">
                        <TableCell>
                          <span className="flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-8 h-8 text-sm font-medium">
                            {process.order}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{process.name}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-default">
                            {process.department}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{process.description}</TableCell>
                        <TableCell className="font-medium text-blue-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {process.manager}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={hasAccess ? "default" : "outline"}
                                  className={hasAccess 
                                    ? "gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                                    : "gap-1 opacity-50 cursor-not-allowed"
                                  }
                                  onClick={() => hasAccess && handleDepartmentClick(process.department || '', selectedProject)}
                                  disabled={!hasAccess}
                                >
                                  进入部门
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              {!hasAccess && (
                                <TooltipContent>
                                  <p>您没有权限访问此部门</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProcesses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        暂无工序数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <h2 className="mb-4 text-xl font-bold text-slate-800">工作工序状态说明</h2>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 rounded-lg border p-4 hover:shadow-sm transition-shadow">
                  <div className="rounded-full bg-slate-300 p-2 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">待开始</h3>
                    <p className="text-sm text-slate-500">
                      工作工序尚未开始，等待前置工序完成或资源分配
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 rounded-lg border p-4 hover:shadow-sm transition-shadow">
                  <div className="rounded-full bg-blue-500 p-2 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">进行中</h3>
                    <p className="text-sm text-slate-500">
                      工作工序正在执行中，工作人员正在处理相关任务
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 rounded-lg border p-4 hover:shadow-sm transition-shadow">
                  <div className="rounded-full bg-green-500 p-2 text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">已完成</h3>
                    <p className="text-sm text-slate-500">
                      工作工序已完成，所有任务已按要求完成
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
