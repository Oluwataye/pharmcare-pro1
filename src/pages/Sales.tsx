import SalesStats from "@/components/sales/SalesStats";
import SalesToolbar from "@/components/sales/SalesToolbar";
import RecentSales from "@/components/sales/RecentSales";

const Sales = () => {
  return (
    <div className="p-6 space-y-6">
      <SalesToolbar />
      <SalesStats />
      <RecentSales />
    </div>
  );
};

export default Sales;