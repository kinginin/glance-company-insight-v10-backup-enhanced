import { useState } from "react";
import { Bell, User, Search, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, logout, departmentNames } from "@/services/auth";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [notifications] = useState(3);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      className={`flex h-16 items-center border-b bg-white px-6 shadow-sm ${className}`}
    >
      {/* 搜索框 */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索项目、工序..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
        <h1 className="text-lg font-medium text-slate-700 md:hidden">企业项目管理系统</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* 通知按钮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="通知"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {notifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {notifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>通知消息</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1">
              <span className="font-medium">您有3条未读消息</span>
              <span className="text-xs text-slate-500">刚刚</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1">
              <span className="font-medium">项目"CRM系统开发"有新的更新</span>
              <span className="text-xs text-slate-500">10分钟前</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1">
              <span className="font-medium">"年度市场推广计划"进度已更新</span>
              <span className="text-xs text-slate-500">1小时前</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 hover:bg-slate-100"
              aria-label="用户菜单"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-700">
                  {currentUser?.fullName || '用户'}
                </p>
                <p className="text-xs text-slate-500">
                  {currentUser ? departmentNames[currentUser.department] : '未知部门'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{currentUser?.fullName}</span>
                <span className="text-xs font-normal text-slate-500">
                  @{currentUser?.username}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-default">
              <Badge variant="secondary" className="font-normal">
                {currentUser ? departmentNames[currentUser.department] : '未知'}
              </Badge>
              <span className="text-xs text-slate-500">当前部门</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
              系统设置
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate('/settings')}>
              <User className="h-4 w-4" />
              个人信息
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
              onClick={handleLogout}
            >
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
