import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DashboardLayout />}>
              {/* Admin routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/inventory" element={<Inventory />} />
              <Route path="/admin/sales" element={<Sales />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/settings" element={<Settings />} />
              
              {/* Pharmacist routes */}
              <Route path="/pharmacist" element={<Dashboard />} />
              <Route path="/pharmacist/inventory" element={<Inventory />} />
              <Route path="/pharmacist/prescriptions" element={<Sales />} />
              
              {/* Cashier routes */}
              <Route path="/cashier" element={<Dashboard />} />
              <Route path="/cashier/sales" element={<Sales />} />
              <Route path="/cashier/sales/new" element={<NewSale />} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;