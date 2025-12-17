
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectStats, getProjects } from "@/services/data";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

export default function Reports() {
  const stats = getProjectStats();
  const projects = getProjects();
  
  // 准备饼图数据
  const pieChartData = [
    { name: "规划中", value: stats.planning, color: "#3b82f6" },
    { name: "进行中", value: stats.inProgress, color: "#f59e0b" },
    { name: "审核中", value: stats.review, color: "#8b5cf6" },
    { name: "已完成", value: stats.completed, color: "#10b981" }
  ];
  
  // 准备柱状图数据 - 项目进度
  const progressData = projects.map(project => ({
    name: project.name.length > 10 ? project.name.substring(0, 10) + '...' : project.name,
    进度: project.progress
  }));
  
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <h1 className="mb-6 text-2xl font-bold text-slate-800">数据报表</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* 项目状态分布图 */}
            <Card>
              <CardHeader>
                <CardTitle>项目状态分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value} 个项目`, '数量']} 
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* 项目进度图 */}
            <Card>
              <CardHeader>
                <CardTitle>项目进度对比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={progressData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 50
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        label={{ value: '进度 %', angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, '完成度']} 
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                      <Bar dataKey="进度" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 项目统计概览 */}
          <h2 className="mb-4 mt-8 text-xl font-bold text-slate-800">项目统计概览</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500">总项目数</h3>
                  <div className="text-3xl font-bold">{stats.total}</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500">已完成项目</h3>
                  <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500">进行中项目</h3>
                  <div className="text-3xl font-bold text-amber-600">{stats.inProgress}</div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500">平均完成度</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {isNaN(stats.averageProgress) ? 0 : Math.round(stats.averageProgress)}%
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
