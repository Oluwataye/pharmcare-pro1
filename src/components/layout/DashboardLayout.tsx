
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ShiftStatusHeader } from "../shifts/ShiftStatusHeader";
import { useLocation } from "react-router-dom";
import { SessionTimeout } from "@/components/security/SessionTimeout";

const DashboardLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden flex items-center border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-2"
          title="Toggle Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary">PharmaCare Pro</h1>
      </div>

      {/* Sidebar - hidden on mobile by default unless toggled */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:flex-shrink-0`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50 flex flex-col">
        {/* Top Header for Desktop */}
        <header className="h-16 border-b bg-white/50 backdrop-blur-md px-8 hidden md:flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-semibold text-lg text-primary capitalize">
            {location.pathname.split('/').pop() || 'Dashboard'}
          </h2>
          <ShiftStatusHeader />
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
        <SessionTimeout />
      </main>
    </div>
  );
};

export default DashboardLayout;
