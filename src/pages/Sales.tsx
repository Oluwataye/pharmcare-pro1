
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sale } from "@/types/sales";
import SalesHeader from "@/components/sales/SalesHeader";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesStatsCards from "@/components/sales/SalesStatsCards";
import SalesTable from "@/components/sales/SalesTable";

const Sales = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Updated mock data with cashier information
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
      cashierId: "1"
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
      cashierId: "2"
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
      status: "pending",
      cashierName: "Admin User",
      cashierEmail: "admin@demo.com",
      cashierId: "3"
    }
  ];

  const filteredSales = recentSales.filter(sale => {
    const matchesSearch = searchTerm === "" || 
      sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.cashierName && sale.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
    const saleDate = new Date(sale.date);
    const matchesDateFrom = !dateFrom || saleDate >= dateFrom;
    const matchesDateTo = !dateTo || saleDate <= dateTo;
    const matchesStatus = filterStatus === "all" || sale.status === filterStatus;
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
  });

  const totalSalesToday = 25500;
  const totalTransactions = 15;
  const averageSaleValue = 1700;
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
        }}
      />
      
      <SalesStatsCards
        totalSalesToday={totalSalesToday}
        totalTransactions={totalTransactions}
        averageSaleValue={averageSaleValue}
        totalDiscounts={totalDiscounts}
      />

      <SalesTable sales={filteredSales} />
      
      <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
        2025 © T-Tech Solutions
      </footer>
    </div>
  );
};

export default Sales;
