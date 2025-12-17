
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { getCurrentUser } from "@/services/auth";
import { Database } from "lucide-react";

export default function Settings() {
  const currentUser = getCurrentUser();
  const [dbConnections, setDbConnections] = useState<{name: string, type: string, host: string, status: string}[]>([
    { name: "主数据库", type: "MySQL", host: "db.example.com", status: "已连接" },
    { name: "备份数据库", type: "PostgreSQL", host: "backup.example.com", status: "未连接" }
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    type: 'MySQL',
    host: '',
    port: '',
    username: '',
    password: '',
    database: ''
  });
  
  const handleAddConnection = () => {
    // 这里实现添加数据库连接的逻辑
    setDbConnections([
      ...dbConnections, 
      { 
        name: newConnection.name, 
        type: newConnection.type, 
        host: newConnection.host, 
        status: "已连接" 
      }
    ]);
    setShowAddForm(false);
    setNewConnection({
      name: '',
      type: 'MySQL',
      host: '',
      port: '',
      username: '',
      password: '',
      database: ''
    });
  };
  
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <h1 className="mb-6 text-2xl font-bold text-slate-800">系统设置</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* 用户信息 */}
            <Card>
              <CardHeader>
                <CardTitle>用户信息</CardTitle>
                <CardDescription>查看和管理您的账户信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input id="username" defaultValue={currentUser?.username} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">全名</Label>
                  <Input id="fullName" defaultValue={currentUser?.fullName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">角色</Label>
                  <Input id="role" defaultValue={currentUser?.role} disabled />
                </div>
                <Button className="mt-4">更新信息</Button>
              </CardContent>
            </Card>
            
            {/* 系统设置 */}
            <Card>
              <CardHeader>
                <CardTitle>系统偏好设置</CardTitle>
                <CardDescription>自定义系统设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">接收邮件通知</p>
                    <p className="text-sm text-slate-500">当项目有更新时通过邮件通知您</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">桌面通知</p>
                    <p className="text-sm text-slate-500">启用桌面推送通知</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">报表自动发送</p>
                    <p className="text-sm text-slate-500">每周自动发送项目进度报表</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full">保存设置</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* 数据库连接 */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>数据库连接</CardTitle>
                  <CardDescription>管理系统的数据库连接</CardDescription>
                </div>
                <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  添加连接
                </Button>
              </CardHeader>
              <CardContent>
                {showAddForm ? (
                  <div className="space-y-4 border rounded-md p-4 bg-slate-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dbName">连接名称</Label>
                        <Input 
                          id="dbName" 
                          value={newConnection.name}
                          onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                          placeholder="输入连接名称" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dbType">数据库类型</Label>
                        <select 
                          id="dbType"
                          value={newConnection.type}
                          onChange={(e) => setNewConnection({...newConnection, type: e.target.value})}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="MySQL">MySQL</option>
                          <option value="PostgreSQL">PostgreSQL</option>
                          <option value="SQLServer">SQL Server</option>
                          <option value="Oracle">Oracle</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dbHost">主机地址</Label>
                        <Input 
                          id="dbHost" 
                          value={newConnection.host}
                          onChange={(e) => setNewConnection({...newConnection, host: e.target.value})}
                          placeholder="例如: localhost 或 db.example.com" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dbPort">端口</Label>
                        <Input 
                          id="dbPort" 
                          value={newConnection.port}
                          onChange={(e) => setNewConnection({...newConnection, port: e.target.value})}
                          placeholder="例如: 3306" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dbUsername">用户名</Label>
                        <Input 
                          id="dbUsername" 
                          value={newConnection.username}
                          onChange={(e) => setNewConnection({...newConnection, username: e.target.value})}
                          placeholder="数据库用户名" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dbPassword">密码</Label>
                        <Input 
                          id="dbPassword" 
                          type="password"
                          value={newConnection.password}
                          onChange={(e) => setNewConnection({...newConnection, password: e.target.value})}
                          placeholder="数据库密码" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dbName">数据库名称</Label>
                      <Input 
                        id="dbName" 
                        value={newConnection.database}
                        onChange={(e) => setNewConnection({...newConnection, database: e.target.value})}
                        placeholder="数据库名称" 
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>取消</Button>
                      <Button onClick={handleAddConnection}>保存连接</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>连接名称</TableHead>
                          <TableHead>数据库类型</TableHead>
                          <TableHead>主机地址</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbConnections.map((connection, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{connection.name}</TableCell>
                            <TableCell>{connection.type}</TableCell>
                            <TableCell>{connection.host}</TableCell>
                            <TableCell>
                              <Badge className={connection.status === "已连接" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {connection.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">编辑</Button>
                              <Button variant="ghost" size="sm" className="text-red-600">删除</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {dbConnections.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              暂无数据库连接
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 数据备份 */}
            <Card>
              <CardHeader>
                <CardTitle>数据管理</CardTitle>
                <CardDescription>备份和导出系统数据</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <h3 className="mb-2 font-medium">数据备份</h3>
                  <p className="mb-4 text-sm text-slate-500">
                    导出所有项目数据和工作工序信息到Excel文件
                  </p>
                  <Button variant="outline">导出数据</Button>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <h3 className="mb-2 font-medium">导入数据</h3>
                  <p className="mb-4 text-sm text-slate-500">
                    从Excel文件导入项目数据和工作工序
                  </p>
                  <Button variant="outline">导入数据</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* 关于系统 */}
            <Card>
              <CardHeader>
                <CardTitle>关于系统</CardTitle>
                <CardDescription>系统信息和版本</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">系统名称</h3>
                    <p className="text-slate-500">企业项目管理系统</p>
                  </div>
                  <div>
                    <h3 className="font-medium">当前版本</h3>
                    <p className="text-slate-500">1.0.0</p>
                  </div>
                  <div>
                    <h3 className="font-medium">更新日志</h3>
                    <ul className="list-inside list-disc text-sm text-slate-500">
                      <li>优化了项目进度跟踪功能</li>
                      <li>增加了工作工序管理功能</li>
                      <li>改进了报表数据可视化</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
