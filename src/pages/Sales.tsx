import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { printReceipt } from "@/utils/receiptPrinter";
import { Sale } from "@/types/sales";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Plus } from "lucide-react";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesStatsCards from "@/components/sales/SalesStatsCards";

const Sales = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
      status: "completed"
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
      status: "completed"
    },
    {
      id: "3",
      items: [{
        id: "3",
        name: "Vitamin C",
        quantity: 3,
        price: 800,
        total: 2400
      }],
      total: 2400,
      date: "2024-02-21",
      status: "pending"
    }
  ];

  const filteredSales = recentSales.filter(sale => {
    const matchesSearch = searchTerm === "" || 
      sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const saleDate = new Date(sale.date);
    const matchesDateFrom = !dateFrom || saleDate >= dateFrom;
    const matchesDateTo = !dateTo || saleDate <= dateTo;
    const matchesStatus = filterStatus === "all" || sale.status === filterStatus;
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
  });

  const totalSalesToday = 25500;
  const totalTransactions = 15;
  const averageSaleValue = 1700;

  const handlePrintInvoice = async (saleId: string) => {
    const sale = recentSales.find(s => s.id === saleId);
    if (!sale) return;

    try {
      await printReceipt({
        items: sale.items,
        date: new Date(sale.date),
        cashierName: user ? user.name : undefined,
      });

      toast({
        title: "Print Initiated",
        description: "Receipt sent to printer",
      });
    } catch (error) {
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to print receipt",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold">Sales Management</h1>
        <Button onClick={() => navigate("/sales/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>
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
        }}
      />
      <SalesStatsCards
        totalSalesToday={totalSalesToday}
        totalTransactions={totalTransactions}
        averageSaleValue={averageSaleValue}
      />

      <div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price (₦)</TableHead>
                <TableHead>Total (₦)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.items[0].name}</TableCell>
                    <TableCell>{sale.items[0].quantity}</TableCell>
                    <TableCell>{sale.items[0].price}</TableCell>
                    <TableCell>{sale.items[0].total}</TableCell>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sale.status === "completed" 
                          ? "bg-green-50 text-green-700" 
                          : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePrintInvoice(sale.id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No sales found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div>
  );
};

export default Sales;
