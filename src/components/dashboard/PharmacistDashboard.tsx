import { Card } from "@/components/ui/card";
import { DashboardStat } from "@/lib/types";
import { AlertTriangle, Clock, Pill, Package } from "lucide-react";
import StatsGrid from "./StatsGrid";

const pharmacistStats: DashboardStat[] = [
  {
    title: "Low Stock Items",
    value: "23",
    icon: AlertTriangle,
    trend: "+5",
    trendUp: false,
  },
  {
    title: "Expiring Soon",
    value: "15",
    icon: Clock,
    trend: "+2",
    trendUp: false,
  },
  {
    title: "Total Products",
    value: "1,456",
    icon: Pill,
    trend: "+3",
    trendUp: true,
  },
  {
    title: "Purchase Orders",
    value: "8",
    icon: Package,
    trend: "+1",
    trendUp: true,
  },
];

const PharmacistDashboard = () => {
  return (
    <>
      <StatsGrid stats={pharmacistStats} />
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Expiring Medications</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No medications expiring soon
            </p>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Purchase Orders</h3>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              No pending purchase orders
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PharmacistDashboard;