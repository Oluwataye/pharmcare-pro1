import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sale } from "@/types/sales";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesStatsCards from "@/components/sales/SalesStatsCards";
import SalesTable from "@/components/sales/SalesTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingBag, Package, RefreshCw, Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportSalesToCSV, exportSalesToExcel } from "@/utils/salesExport";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Sales = () => {
  const { toast } = useToast();
  const { canReadWholesale } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [saleTypeFilter, setSaleTypeFilter] = useState<"all" | "retail" | "wholesale">("all");
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch sales from database
  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
            id,
            total,
            discount,
            created_at,
            status,
            sale_type,
            cashier_name,
            cashier_email,
            cashier_id,
            customer_name,
            customer_phone,
            business_name,
            business_address,
            transaction_id
          `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Fetch sales items for each sale
      const salesWithItems: Sale[] = await Promise.all(
        (salesData || []).map(async (sale) => {
          const { data: itemsData } = await supabase
            .from('sales_items')
            .select('id, product_name, quantity, unit_price, price, discount, total, is_wholesale')
            .eq('sale_id', sale.id);

          return {
            id: sale.id,
            items: (itemsData || []).map(item => ({
              id: item.id,
              name: item.product_name,
              quantity: item.quantity,
              price: Number(item.unit_price),
              total: Number(item.total),
              discount: item.discount ? Number(item.discount) : undefined,
              isWholesale: item.is_wholesale || false,
            })),
            total: Number(sale.total),
            discount: sale.discount ? Number(sale.discount) : undefined,
            date: new Date(sale.created_at || '').toISOString().split('T')[0],
            status: sale.status as 'completed' | 'pending' | 'cancelled',
            cashierName: sale.cashier_name || undefined,
            cashierEmail: sale.cashier_email || undefined,
            cashierId: sale.cashier_id || undefined,
            customerName: sale.customer_name || undefined,
            customerPhone: sale.customer_phone || undefined,
            businessName: sale.business_name || undefined,
            businessAddress: sale.business_address || undefined,
            saleType: sale.sale_type as 'retail' | 'wholesale',
            transactionId: sale.transaction_id,
          };
        })
      );

      setSales(salesWithItems);
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleExportCSV = () => {
    exportSalesToCSV(filteredSales);
    toast({
      title: "Export Complete",
      description: `Exported ${filteredSales.length} sales to CSV`,
    });
  };

  const handleExportExcel = () => {
    exportSalesToExcel(filteredSales);
    toast({
      title: "Export Complete",
      description: `Exported ${filteredSales.length} sales to Excel`,
    });
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchSales();
  };

  const filteredSales = sales.filter(sale => {
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
  const totalSalesToday = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const totalRetailSales = retailSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalWholesaleSales = wholesaleSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSaleValue = filteredSales.length > 0 ?
    (totalRetailSales + totalWholesaleSales) / filteredSales.length : 0;
  const totalDiscounts = filteredSales.reduce((sum, sale) => sum + (sale.discount || 0), 0);

  // Pagination logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, filterStatus, saleTypeFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SalesHeader title="Sales Management" />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={filteredSales.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <EnhancedCard colorScheme="primary">
        <CardContent className="pt-6">
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
        </CardContent>
      </EnhancedCard>

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

      <EnhancedCard colorScheme="primary">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTable
            sales={paginatedSales}
            showBusinessInfo={true}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSales.length}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </EnhancedCard>

      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div>
  );
};

export default Sales;
