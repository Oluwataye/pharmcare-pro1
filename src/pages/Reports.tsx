
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Package, 
  ShoppingCart, 
  Users 
} from "lucide-react";
import InventoryReport from "@/components/reports/InventoryReport";
import TransactionsReport from "@/components/reports/TransactionsReport";
import UserAuditReport from "@/components/reports/UserAuditReport";
import SalesReport from "@/components/reports/SalesReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View detailed reports and analytics for your pharmacy
        </p>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Audit
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <InventoryReport />
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionsReport />
        </TabsContent>

        <TabsContent value="users">
          <UserAuditReport />
        </TabsContent>

        <TabsContent value="sales">
          <SalesReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
