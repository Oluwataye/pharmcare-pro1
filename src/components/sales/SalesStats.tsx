import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SalesStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦25,500</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">15</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Sale Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦1,700</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesStats;