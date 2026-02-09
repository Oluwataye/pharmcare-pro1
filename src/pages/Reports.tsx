
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { useLocation } from "react-router-dom";
import {
  FileText,
  Package,
  ShoppingBag,
  Users,
  History,
  Calendar,
  Shield,
  Tag,
  RefreshCcw,
  Calculator,
  Target
} from "lucide-react";
import InventoryReport from "@/components/reports/InventoryReport";
import TransactionsReport from "@/components/reports/TransactionsReport";
import UserAuditReport from "@/components/reports/UserAuditReport";
import SalesReport from "@/components/reports/SalesReport";
import DiscountReport from "@/components/reports/DiscountReport";
import TransactionAuditLog from "@/components/reports/TransactionAuditLog";
import ExpiringDrugsReport from "@/components/reports/ExpiringDrugsReport";
import AuditLogReport from "@/components/reports/AuditLogReport";
import { ExpiryNotificationModal } from "@/components/reports/ExpiryNotificationModal";
import StockAdjustmentReport from "@/components/reports/StockAdjustmentReport";
import ProfitAndLossReport from "@/components/reports/ProfitAndLossReport";
import BudgetVsActual from "@/components/reports/BudgetVsActual";
import StaffPerformanceReport from "@/components/reports/StaffPerformanceReport";
import { Spinner } from "@/components/ui/spinner";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/contexts/AuthContext";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("inventory");
  const [isLoading, setIsLoading] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const location = useLocation();
  const { getExpiringItems } = useInventory();
  const { user } = useAuth();

  // Check if there are critical expiring items
  const criticalItems = getExpiringItems(30);
  const hasExpiringItems = criticalItems.length > 0;

  // Check if we should open a specific tab based on navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      handleTabChange(location.state.activeTab);

      // Clear the state to avoid reopening the tab on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Show expiry modal if there are critical items and we're not already on the expiring tab
  useEffect(() => {
    if (hasExpiringItems && activeTab !== "expiring") {
      setShowExpiryModal(true);
    }
  }, []);

  // Direct tab switching without artificial delay
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle viewing the expiry report from the modal
  const handleViewExpiryReport = () => {
    setShowExpiryModal(false);
    handleTabChange("expiring");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          View detailed reports and analytics for your pharmacy
        </p>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-auto min-w-full sm:w-fit">
            <TabsTrigger value="inventory" className="flex items-center gap-2 whitespace-nowrap">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
              <span className="sm:hidden">Inv</span>
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex items-center gap-2 whitespace-nowrap">
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Stock Adjustments</span>
              <span className="sm:hidden">Adj</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 whitespace-nowrap">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Sales Volume</span>
              <span className="sm:hidden">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="pnl" className="flex items-center gap-2 whitespace-nowrap text-emerald-600 font-bold">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Profit & Loss</span>
              <span className="sm:hidden">P&L</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2 whitespace-nowrap text-blue-600 font-bold">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Budget vs Actual</span>
              <span className="sm:hidden">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="staff-performance" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Staff Performance</span>
              <span className="sm:hidden">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2 whitespace-nowrap">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Discounts</span>
              <span className="sm:hidden">Disc</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Audit</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2 whitespace-nowrap">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Transaction Audit</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Expiring Drugs</span>
              <span className="sm:hidden">Expiry</span>
              {hasExpiringItems && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
            </TabsTrigger>
            {user?.role === 'SUPER_ADMIN' && (
              <TabsTrigger value="security" className="flex items-center gap-2 whitespace-nowrap">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security Audit</span>
                <span className="sm:hidden">Security</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="min-h-[600px] w-full">
          <TabsContent value="inventory">
            <InventoryReport />
          </TabsContent>

          <TabsContent value="adjustments">
            <StockAdjustmentReport />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsReport />
          </TabsContent>

          <TabsContent value="pnl" className="space-y-4">
            <ProfitAndLossReport />
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <BudgetVsActual />
          </TabsContent>

          <TabsContent value="staff-performance" className="space-y-4">
            <StaffPerformanceReport />
          </TabsContent>


          <TabsContent value="discounts">
            <DiscountReport />
          </TabsContent>

          <TabsContent value="users">
            <UserAuditReport />
          </TabsContent>

          <TabsContent value="audit">
            <TransactionAuditLog />
          </TabsContent>

          <TabsContent value="expiring">
            <ExpiringDrugsReport />
          </TabsContent>

          {user?.role === 'SUPER_ADMIN' && (
            <TabsContent value="security">
              <AuditLogReport />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <ExpiryNotificationModal
        open={showExpiryModal}
        onOpenChange={setShowExpiryModal}
        onViewReport={handleViewExpiryReport}
      />
    </div>
  );
};

export default Reports;
