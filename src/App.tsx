import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import CashierDashboard from "./pages/CashierDashboard";

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
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "read", resource: "settings" }}
                  >
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "read", resource: "inventory" }}
                  >
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "read", resource: "sales" }}
                  >
                    <Sales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales/new"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "create", resource: "sales" }}
                  >
                    <NewSale />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "read", resource: "users" }}
                  >
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "update", resource: "settings" }}
                  >
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacist"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "read", resource: "inventory" }}
                  >
                    <PharmacistDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cashier"
                element={
                  <ProtectedRoute
                    requiredPermission={{ action: "create", resource: "sales" }}
                  >
                    <CashierDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
