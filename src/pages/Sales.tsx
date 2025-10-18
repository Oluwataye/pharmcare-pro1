
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useFetchSales } from "@/hooks/useFetchSales";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesStatsCards from "@/components/sales/SalesStatsCards";
import SalesTable from "@/components/sales/SalesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, Loader2 } from "lucide-react";

const Sales = () => {
  const { toast } = useToast();
  const { canReadWholesale } = usePermissions();
  const { sales: recentSales, isLoading } = useFetchSales();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saleTypeFilter, setSaleTypeFilter] = useState<"all" | "retail" | "wholesale">("all");

  const filteredSales = recentSales.filter(sale => {
    const matchesSearch = searchTerm === "" || 
      sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.cashierName && sale.cashierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.businessName && sale.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const saleDate = new Date(sale.date);
    const matchesDateFrom = !dateFrom || saleDate >= dateFrom;
    const matchesDateTo = !dateTo || saleDate <= dateTo;
    const matchesStatus = filterStatus === "all" || sale.status === filterStatus;
    const matchesSaleType = saleTypeFilter === "all" || sale.saleType === saleTypeFilter;
    
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus && matchesSaleType;
  });

  const retailSales = filteredSales.filter(sale => sale.saleType === "retail");
  const wholesaleSales = filteredSales.filter(sale => sale.saleType === "wholesale");

  // Calculate stats from actual data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySales = recentSales.filter(sale => {
    const saleDate = new Date(sale.date);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === today.getTime();
  });
  
  const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const totalRetailSales = retailSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalWholesaleSales = wholesaleSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSaleValue = filteredSales.length > 0 ? 
    (totalRetailSales + totalWholesaleSales) / filteredSales.length : 0;
  const totalDiscounts = filteredSales.reduce((sum, sale) => {
    const saleDiscount = (sale.discount || 0) * sale.total / 100;
    return sum + saleDiscount;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <SalesHeader title="Sales Management" />
      
      <SalesFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        onClear={() => {
          setSearchTerm("");
          setDateFrom(undefined);
          setDateTo(undefined);
          setFilterStatus("all");
          setSaleTypeFilter("all");
        }}
      />
      
      <SalesStatsCards
        totalSalesToday={totalSalesToday}
        totalTransactions={totalTransactions}
        averageSaleValue={averageSaleValue}
        totalDiscounts={totalDiscounts}
        totalRetailSales={totalRetailSales}
        totalWholesaleSales={totalWholesaleSales}
      />

      {canReadWholesale && (
        <Tabs
          defaultValue={saleTypeFilter}
          onValueChange={(value) => setSaleTypeFilter(value as "all" | "retail" | "wholesale")}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Sales</TabsTrigger>
            <TabsTrigger value="retail" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Retail
            </TabsTrigger>
            <TabsTrigger value="wholesale" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Wholesale
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <SalesTable 
        sales={filteredSales}
        showBusinessInfo={true}
      />
      
      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div>
  );
};

export default Sales;
