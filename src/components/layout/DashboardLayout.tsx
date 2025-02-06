import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Loader2 } from "lucide-react";

const DashboardLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPharmacistRoute = location.pathname.startsWith('/pharmacist');
  const isCashierRoute = location.pathname.startsWith('/cashier');

  if (
    (isAdminRoute && user?.role !== 'ADMIN') ||
    (isPharmacistRoute && user?.role !== 'PHARMACIST') ||
    (isCashierRoute && user?.role !== 'CASHIER')
  ) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = user?.role === 'ADMIN' 
      ? '/admin'
      : user?.role === 'PHARMACIST'
        ? '/pharmacist'
        : '/cashier';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;