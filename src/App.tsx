import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleGuard } from "./components/auth/RoleGuard";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Super Admin Routes */}
            <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Pharmacist Routes */}
            <Route element={<RoleGuard allowedRoles={['PHARMACIST']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/" element={<Dashboard />} />
              </Route>
            </Route>

            {/* Cashier Routes */}
            <Route element={<RoleGuard allowedRoles={['CASHIER']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/new" element={<NewSale />} />
                <Route path="/" element={<Dashboard />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;