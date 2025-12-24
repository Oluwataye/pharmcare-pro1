import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SessionTimeoutWarning } from "./components/auth/SessionTimeoutWarning";
import { OfflineProvider } from "./contexts/OfflineContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { Spinner } from "./components/ui/spinner";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";
import { NotificationPermissionBanner } from "./components/notifications/NotificationPermissionBanner";

// Lazy load pages for better code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Sales = lazy(() => import("./pages/Sales"));
const NewSale = lazy(() => import("./pages/NewSale"));
const Receipts = lazy(() => import("./pages/Receipts"));
const PrintHistory = lazy(() => import("./pages/PrintHistory"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reports = lazy(() => import("./pages/Reports"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Spinner className="h-8 w-8" />
  </div>
);

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
        <SessionTimeoutWarning />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineBanner />
          <PWAInstallPrompt />
          <NotificationPermissionBanner />
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
                <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute
                      requiredPermission={{ action: "read", resource: "inventory" }}
                    >
                      <Suspense fallback={<PageLoader />}><Inventory /></Suspense>
                    </ProtectedRoute>
                  }
                />
                {/* All roles can access sales now */}
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><Sales /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales/new"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><NewSale /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><Receipts /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/print-history"
                  element={
                    <ProtectedRoute
                      requiredPermission={{ action: "read", resource: "reports" }}
                    >
                      <Suspense fallback={<PageLoader />}><PrintHistory /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute
                      requiredPermission={{ action: "read", resource: "users" }}
                    >
                      <Suspense fallback={<PageLoader />}><Users /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}><Settings /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute
                      requiredPermission={{ action: "read", resource: "reports" }}
                    >
                      <Suspense fallback={<PageLoader />}><Reports /></Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </OfflineProvider>
  </PersistQueryClientProvider>
);

export default App;
