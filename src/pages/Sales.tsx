
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sale } from "@/types/sales";
import { usePermissions } from "@/hooks/usePermissions";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesStatsCards from "@/components/sales/SalesStatsCards";
import SalesTable from "@/components/sales/SalesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package } from "lucide-react";

const Sales = () => {
  const { toast } = useToast();
  const { canReadWholesale } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saleTypeFilter, setSaleTypeFilter] = useState<"all" | "retail" | "wholesale">("all");

  // Updated mock data with sale type and business information
  const recentSales: Sale[] = [
    {
      id: "1",
      items: [{
        id: "1",
        name: "Paracetamol",
        quantity: 2,
        price: 500,
        total: 1000
      }],
      total: 1000,
      date: "2024-02-20",
      status: "completed",
      cashierName: "John Doe",
      cashierEmail: "john.doe@pharmacy.com",
      cashierId: "1",
      saleType: "retail"
    },
    {
      id: "2",
      items: [{
        id: "2",
        name: "Amoxicillin",
        quantity: 1,
        price: 1500,
        total: 1500
      }],
      total: 1500,
      date: "2024-02-20",
      status: "completed",
      cashierName: "Jane Smith",
      cashierEmail: "jane.smith@pharmacy.com",
      cashierId: "2",
      saleType: "retail"
    },
    {
      id: "3",
      items: [{
        id: "3",
        name: "Vitamin C",
        quantity: 30,
        price: 700, // Wholesale price
        isWholesale: true,
        total: 21000
      }],
      total: 21000,
      date: "2024-02-21",
      status: "completed",
      businessName: "City Hospital",
      businessAddress: "123 Main Street",
      cashierName: "Admin User",
      cashierEmail: "admin@demo.com",
      cashierId: "3",
      saleType: "wholesale"
    },
    {
      id: "4",
      items: [{
        id: "4",
        name: "Amoxicillin",
        quantity: 25,
        price: 1000, // Wholesale price
        isWholesale: true,
        total: 25000
      }],
      total: 25000,
      date: "2024-02-22",
      status: "completed",
      businessName: "Health Clinic Ltd",
      businessAddress: "45 Park Avenue",
      cashierName: "Admin User",
      cashierEmail: "admin@demo.com",
      cashierId: "3",
      saleType: "wholesale"
    }
  ];

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

  // Calculate stats
  const totalSalesToday = 25500;
  const totalTransactions = filteredSales.length;
  const totalRetailSales = retailSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalWholesaleSales = wholesaleSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSaleValue = filteredSales.length > 0 ? 
    (totalRetailSales + totalWholesaleSales) / filteredSales.length : 0;
  const totalDiscounts = 1500;

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
