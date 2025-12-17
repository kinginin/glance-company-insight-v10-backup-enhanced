import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, Department, departmentRoutes } from "@/services/auth";

interface DepartmentGuardProps {
  department: Department;
  children: React.ReactNode;
}

export function DepartmentGuard({ department, children }: DepartmentGuardProps) {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    // 防止重复检查
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }
    
    // 管理员和领导可以访问所有部门
    if (currentUser.role === 'admin' || currentUser.role === 'leader') {
      setHasAccess(true);
      return;
    }
    
    // 部门经理、副经理和员工可以访问自己的部门
    if (currentUser.department === department) {
      setHasAccess(true);
      return;
    }
    
    // 其他情况无权限，重定向到自己的部门
    setHasAccess(false);
    const targetRoute = currentUser.department ? departmentRoutes[currentUser.department] : '/dashboard';
    navigate(targetRoute || '/dashboard', { replace: true });
  }, [department, navigate]);

  if (hasAccess === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // 已经重定向，不需要显示任何内容
  }

  return <>{children}</>;
}
