import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => console.log("Query cache restored successfully")}
    >
      <TooltipProvider>
        <OfflineProvider>
          <AuthProvider>
            <InventoryProvider>
              <ShiftProvider>
                <BrowserRouter>
                  <AutoBackupManager />
                  <OfflineBanner />
                  <PWAInstallPrompt />
                  <NotificationPermissionBanner />
                  <Toaster />
                  <Sonner />
                  <ConflictResolutionDialog />

                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<Login />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={
                          <ErrorBoundary><Dashboard /></ErrorBoundary>
                        } />
                        <Route path="/inventory" element={
                          <ErrorBoundary><Inventory /></ErrorBoundary>
                        } />
                        <Route path="/sales" element={
                          <ErrorBoundary><Sales /></ErrorBoundary>
                        } />
                        <Route path="/sales/new" element={
                          <ErrorBoundary><NewSale /></ErrorBoundary>
                        } />
                        <Route path="/sales/receipts" element={
                          <ErrorBoundary><Receipts /></ErrorBoundary>
                        } />
                        <Route path="/sales/history" element={
                          <ErrorBoundary><PrintHistory /></ErrorBoundary>
                        } />
                        <Route path="/sales/refunds" element={
                          <ErrorBoundary><RefundApproval /></ErrorBoundary>
                        } />
                        <Route path="/reports/*" element={
                          <ErrorBoundary><Reports /></ErrorBoundary>
                        } />
                        <Route path="/analytics" element={
                          <ErrorBoundary><Analytics /></ErrorBoundary>
                        } />
                        <Route path="/users" element={
                          <ErrorBoundary><Users /></ErrorBoundary>
                        } />
                        <Route path="/settings" element={
                          <ErrorBoundary><Settings /></ErrorBoundary>
                        } />
                        <Route path="/suppliers" element={
                          <ErrorBoundary><Suppliers /></ErrorBoundary>
                        } />
                        <Route path="/shifts" element={
                          <ErrorBoundary><ShiftManagement /></ErrorBoundary>
                        } />
                        <Route path="/expenses" element={
                          <ErrorBoundary><Expenses /></ErrorBoundary>
                        } />
                        <Route path="/cash-reconciliation" element={
                          <ErrorBoundary><CashReconciliation /></ErrorBoundary>
                        } />
                        <Route path="/training" element={
                          <ErrorBoundary><Training /></ErrorBoundary>
                        } />
                        <Route path="/credit" element={
                          <ErrorBoundary><CreditManagement /></ErrorBoundary>
                        } />
                        <Route path="/technical-guide" element={
                          <ErrorBoundary><TechnicalGuide /></ErrorBoundary>
                        } />
                      </Route>

                      {/* Catch-all */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </ShiftProvider>
            </InventoryProvider>
          </AuthProvider>
        </OfflineProvider>
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
