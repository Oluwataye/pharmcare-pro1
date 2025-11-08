
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import Receipts from "./pages/Receipts";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { OfflineBanner } from "./components/layout/OfflineBanner";

interface AppProps {
  queryClient: QueryClient;
  persister: Persister;
}

const App = ({ queryClient, persister }: AppProps) => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ 
      persister,
      dehydrateOptions: {
        shouldDehydrateQuery: query => {
          // Only persist cacheable queries
          return query.state.status === 'success' && !query.meta?.skipPersist;
        },
      },
    }}
  >
    <OfflineProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineBanner />
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
                <Route path="/" element={<Dashboard />} />
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
                {/* All roles can access sales now */}
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <Sales />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/new"
                  element={
                    <ProtectedRoute>
                      <NewSale />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts"
                  element={
                    <ProtectedRoute>
                      <Receipts />
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
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute
                      requiredPermission={{ action: "read", resource: "reports" }}
                    >
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </OfflineProvider>
  </PersistQueryClientProvider>
);

export default App;
