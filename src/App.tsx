import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import { ShiftProvider } from "./contexts/ShiftContext";
import { ConflictResolutionDialog } from "./components/sync/ConflictResolutionDialog";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { Persister } from "@tanstack/react-query-persist-client";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { Spinner } from "./components/ui/spinner";
import { PWAInstallPrompt } from "./components/pwa/PWAInstallPrompt";
import { NotificationPermissionBanner } from "./components/notifications/NotificationPermissionBanner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useAutoBackup } from "./hooks/useAutoBackup";

const AutoBackupManager = () => {
  useAutoBackup();
  return null;
};

// Lazy load pages for better code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Sales = lazy(() => import("./pages/Sales"));
const NewSale = lazy(() => import("./pages/NewSale"));
const Receipts = lazy(() => import("./pages/Receipts"));
const PrintHistory = lazy(() => import("./pages/PrintHistory"));
const RefundApproval = lazy(() => import("./pages/RefundApproval"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const ShiftManagement = lazy(() => import("./pages/ShiftManagement"));
const Expenses = lazy(() => import("./pages/Expenses"));
const CashReconciliation = lazy(() => import("./pages/CashReconciliation"));
const Training = lazy(() => import("./pages/Training"));
const CreditManagement = lazy(() => import("./pages/CreditManagement"));
const TechnicalGuide = lazy(() => import("./pages/TechnicalGuide"));

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

const App = ({ queryClient, persister }: AppProps) => {
  console.log("[App] Pulse: Component rendering... [VERSION: 2026-02-04-UX-FIX]");
  // Log initial mount for debugging
  // logSecurityEvent('APP_MOUNT', {
  return (
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
      <ErrorBoundary>
        <OfflineProvider>
          <AuthProvider>
            <InventoryProvider>
              <ShiftProvider>
                <AutoBackupManager />
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
                        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                        <Route path="/analytics" element={<Suspense fallback={<PageLoader />}><Analytics /></Suspense>} />
                        <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
                        <Route path="/sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
                        <Route path="/sales/new" element={<Suspense fallback={<PageLoader />}><NewSale /></Suspense>} />
                        <Route path="/receipts" element={<Suspense fallback={<PageLoader />}><Receipts /></Suspense>} />
                        <Route path="/reconciliation" element={<Suspense fallback={<PageLoader />}><CashReconciliation /></Suspense>} />
                        <Route path="/users" element={<Suspense fallback={<PageLoader />}><Users /></Suspense>} />
                        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
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
                          path="/refunds"
                          element={
                            <ProtectedRoute
                              requiredPermission={{ action: "read", resource: "reports" }}
                            >
                              <Suspense fallback={<PageLoader />}><RefundApproval /></Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/suppliers"
                          element={
                            <ProtectedRoute
                              requiredPermission={{ action: "read", resource: "suppliers" }}
                            >
                              <Suspense fallback={<PageLoader />}><Suppliers /></Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/shifts"
                          element={
                            <ProtectedRoute
                              requiredPermission={{ action: "read", resource: "shifts" }}
                            >
                              <Suspense fallback={<PageLoader />}><ShiftManagement /></Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/expenses"
                          element={
                            <ProtectedRoute
                              requiredPermission={{ action: "read", resource: "expenses" }}
                            >
                              <Suspense fallback={<PageLoader />}><Expenses /></Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/credit"
                          element={
                            <ProtectedRoute requiredRole="SUPER_ADMIN">
                              <Suspense fallback={<PageLoader />}><CreditManagement /></Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/training"
                          element={
                            <ProtectedRoute requiredRole="SUPER_ADMIN">
                              <Suspense fallback={<PageLoader />}><Training /></Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/technical-guide" element={<Suspense fallback={<PageLoader />}><TechnicalGuide /></Suspense>} />
                        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </ShiftProvider>
            </InventoryProvider>
          </AuthProvider>
        </OfflineProvider>
      </ErrorBoundary>
    </PersistQueryClientProvider>
  );
};

export default App;
