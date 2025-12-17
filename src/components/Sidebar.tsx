import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ListChecks, 
  Calendar, 
  Menu, 
  LogOut,
  Database,
  Building2,
  ChevronDown,
  ChevronRight,
  Palette,
  ShoppingCart,
  Factory,
  Wrench,
  Zap,
  ClipboardCheck,
  Users
} from "lucide-react";
import { logout, getCurrentUser, canAccessDepartment, Department, departmentNames } from "@/services/auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  className?: string;
}

// 部门图标映射
const departmentIcons: Record<Department, React.ComponentType<{ className?: string }>> = {
  'admin': Users,
  'leader': Users,
  'design': Palette,
  'procurement': ShoppingCart,
  'production': Factory,
  'assembly': Wrench,
  'electrical': Zap,
  'quality': ClipboardCheck
};

// 部门路由映射
const departmentRouteMap: { department: Department; route: string }[] = [
  { department: 'design', route: '/departments/design' },
  { department: 'procurement', route: '/departments/procurement' },
  { department: 'production', route: '/departments/production' },
  { department: 'assembly', route: '/departments/assembly' },
  { department: 'electrical', route: '/departments/electrical' },
  { department: 'quality', route: '/departments/quality' },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      title: "仪表盘",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "项目管理",
      href: "/projects",
      icon: ListChecks,
    },
    {
      title: "工作工序",
      href: "/work-process",
      icon: Calendar,
    },
    {
      title: "数据报表",
      href: "/reports",
      icon: Database,
    },
  ];

  // 获取用户可访问的部门
  const accessibleDepartments = departmentRouteMap.filter(item => 
    canAccessDepartment(item.department)
  );

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-gradient-to-b from-slate-50 to-slate-100 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">管理系统</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-slate-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && currentUser && (
        <div className="px-4 py-3 border-b bg-white/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{currentUser.fullName}</p>
              <Badge variant="secondary" className="text-xs">
                {departmentNames[currentUser.department]}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-white hover:shadow-sm",
                  isActive ? "bg-white shadow-sm text-blue-600 font-medium" : "transparent",
                  collapsed && "justify-center px-0"
                )
              }
            >
              <item.icon className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}

          {/* 部门导航 */}
          {!collapsed && accessibleDepartments.length > 0 && (
            <Collapsible open={departmentsOpen} onOpenChange={setDepartmentsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-3 py-2.5 text-slate-700 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    <span>部门管理</span>
                  </div>
                  {departmentsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-4 pt-1">
                {accessibleDepartments.map((item) => {
                  const Icon = departmentIcons[item.department];
                  const isCurrentDept = currentUser?.department === item.department;
                  return (
                    <NavLink
                      key={item.route}
                      to={item.route}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-white hover:shadow-sm",
                          isActive ? "bg-white shadow-sm text-blue-600 font-medium" : "transparent",
                          isCurrentDept && "border-l-2 border-blue-500"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{departmentNames[item.department]}</span>
                      {isCurrentDept && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          我的
                        </Badge>
                      )}
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* 折叠状态下的部门入口 */}
          {collapsed && accessibleDepartments.length > 0 && (
            <NavLink
              to={accessibleDepartments[0].route}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center rounded-lg px-0 py-2.5 text-slate-700 transition-all hover:bg-white hover:shadow-sm",
                  isActive ? "bg-white shadow-sm text-blue-600" : "transparent"
                )
              }
            >
              <Building2 className="h-6 w-6" />
            </NavLink>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-all hover:bg-red-50 hover:text-red-600",
            collapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
          {!collapsed && <span>退出登录</span>}
        </Button>
      </div>
    </div>
  );
}
