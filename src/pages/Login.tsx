import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginAsync, registerAsync, Department, departmentNames } from "@/services/auth";
import { Building2, UserPlus, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  
  // 登录表单状态
  const [loginUsername, setLoginUsername] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("admin");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // 注册表单状态
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regDepartment, setRegDepartment] = useState<Department>("design");
  const [regInviteCode, setRegInviteCode] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  // 可选的部门（排除admin和leader，这些需要特殊权限）
  const availableDepartments: Department[] = [
    'design', 'procurement', 'production', 'assembly', 'electrical', 'quality'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const success = await loginAsync(loginUsername, loginPassword);
      if (success) {
        navigate("/dashboard");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    
    // 验证密码
    if (regPassword !== regConfirmPassword) {
      setRegError("两次输入的密码不一致");
      return;
    }
    
    if (regPassword.length < 4) {
      setRegError("密码长度至少为4位");
      return;
    }
    
    if (!regFullName.trim()) {
      setRegError("请输入姓名");
      return;
    }
    
    setRegLoading(true);
    
    try {
      const result = await registerAsync(regUsername, regPassword, regFullName, regDepartment, 'employee', regInviteCode);
      if (result.success) {
        // 注册成功后自动登录
        const loginSuccess = await loginAsync(regUsername, regPassword);
        if (loginSuccess) {
          navigate("/dashboard");
        }
      } else {
        setRegError(result.message);
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo 和标题 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">企业项目管理系统</h1>
          <p className="mt-2 text-slate-600">高效管理，智能协作</p>
        </div>
        
        <Card className="shadow-xl border-0">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                登录
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                注册
              </TabsTrigger>
            </TabsList>
            
            {/* 登录表单 */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader className="space-y-1 text-center pb-4">
                  <CardTitle className="text-xl">欢迎回来</CardTitle>
                  <CardDescription>请输入您的账号和密码登录系统</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">用户名</Label>
                    <Input
                      id="login-username"
                      placeholder="请输入用户名"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <Input
                      id="login-password"
                      placeholder="请输入密码"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" type="submit" disabled={loginLoading}>
                    {loginLoading ? "登录中..." : "登录"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            {/* 注册表单 */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardHeader className="space-y-1 text-center pb-4">
                  <CardTitle className="text-xl">创建账号</CardTitle>
                  <CardDescription>填写信息并输入邀请码注册</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {regError && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                      {regError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">用户名</Label>
                      <Input
                        id="reg-username"
                        placeholder="请输入用户名"
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-fullname">姓名</Label>
                      <Input
                        id="reg-fullname"
                        placeholder="请输入姓名"
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-department">所属部门</Label>
                    <Select value={regDepartment} onValueChange={(value) => setRegDepartment(value as Department)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {departmentNames[dept]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">密码</Label>
                      <Input
                        id="reg-password"
                        placeholder="请输入密码"
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm-password">确认密码</Label>
                      <Input
                        id="reg-confirm-password"
                        placeholder="再次输入密码"
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-invite-code">邀请码</Label>
                    <Input
                      id="reg-invite-code"
                      placeholder="请输入邀请码"
                      type="text"
                      value={regInviteCode}
                      onChange={(e) => setRegInviteCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-slate-500">请向管理员获取邀请码</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" type="submit" disabled={regLoading}>
                    {regLoading ? "注册中..." : "注册"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <p className="mt-6 text-center text-sm text-slate-500">
          © 2025 企业项目管理系统 · 版权所有
        </p>
      </div>
    </div>
  );
}
