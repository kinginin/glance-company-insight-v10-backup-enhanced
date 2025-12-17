
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "@/services/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import WorkProcess from "./pages/WorkProcess";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import DesignDepartment from "./pages/departments/DesignDepartment";
import ProcurementDepartment from "./pages/departments/ProcurementDepartment";
import ProductionDepartment from "./pages/departments/ProductionDepartment";
import AssemblyDepartment from "./pages/departments/AssemblyDepartment";
import ElectricalDepartment from "./pages/departments/ElectricalDepartment";
import QualityDepartment from "./pages/departments/QualityDepartment";

const queryClient = new QueryClient();

// 受保护的路由组件 - 未登录时重定向到登录页
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = isAuthenticated();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const isLoggedIn = isAuthenticated();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 首页 - 始终重定向到登录页面 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 登录页面 - 已登录则跳转到仪表盘 */}
            <Route path="/login" element={
              isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />
            } />
            
            {/* 系统页面 - 需要登录才能访问 */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute><Projects /></ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute><ProjectDetail /></ProtectedRoute>
            } />
            <Route path="/work-process" element={
              <ProtectedRoute><WorkProcess /></ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />
            
            {/* 部门页面 - 需要登录才能访问 */}
            <Route path="/departments/design/:projectId?" element={
              <ProtectedRoute><DesignDepartment /></ProtectedRoute>
            } />
            <Route path="/departments/procurement/:projectId?" element={
              <ProtectedRoute><ProcurementDepartment /></ProtectedRoute>
            } />
            <Route path="/departments/production/:projectId?" element={
              <ProtectedRoute><ProductionDepartment /></ProtectedRoute>
            } />
            <Route path="/departments/assembly/:projectId?" element={
              <ProtectedRoute><AssemblyDepartment /></ProtectedRoute>
            } />
            <Route path="/departments/electrical/:projectId?" element={
              <ProtectedRoute><ElectricalDepartment /></ProtectedRoute>
            } />
            <Route path="/departments/quality/:projectId?" element={
              <ProtectedRoute><QualityDepartment /></ProtectedRoute>
            } />
            
            {/* 404页面 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
