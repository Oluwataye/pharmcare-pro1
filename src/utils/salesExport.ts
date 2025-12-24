import { Sale } from "@/types/sales";
import { format } from "date-fns";

export const exportSalesToCSV = (sales: Sale[], filename?: string) => {
  const headers = [
    "Transaction ID",
    "Date",
    "Customer",
    "Cashier",
    "Type",
    "Items",
    "Subtotal (₦)",
    "Discount (₦)",
    "Total (₦)",
    "Status",
  ];

  const rows = sales.map((sale) => [
    sale.transactionId || sale.id,
    sale.date,
    sale.customerName || sale.businessName || "Walk-in Customer",
    sale.cashierName || "Unknown",
    sale.saleType,
    sale.items.map((item) => `${item.name} x${item.quantity}`).join("; "),
    sale.items.reduce((sum, item) => sum + item.total, 0).toFixed(2),
    (sale.discount || 0).toFixed(2),
    sale.total.toFixed(2),
    sale.status,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `sales_export_${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportSalesToExcel = (sales: Sale[], filename?: string) => {
  // Excel-compatible CSV with BOM for proper encoding
  const headers = [
    "Transaction ID",
    "Date",
    "Customer",
    "Cashier",
    "Type",
    "Items",
    "Subtotal (₦)",
    "Discount (₦)",
    "Total (₦)",
    "Status",
  ];

  const rows = sales.map((sale) => [
    sale.transactionId || sale.id,
    sale.date,
    sale.customerName || sale.businessName || "Walk-in Customer",
    sale.cashierName || "Unknown",
    sale.saleType,
    sale.items.map((item) => `${item.name} x${item.quantity}`).join("; "),
    sale.items.reduce((sum, item) => sum + item.total, 0).toFixed(2),
    (sale.discount || 0).toFixed(2),
    sale.total.toFixed(2),
    sale.status,
  ]);

  // Tab-separated values work better with Excel
  const tsvContent = [
    headers.join("\t"),
    ...rows.map((row) =>
      row.map((cell) => String(cell).replace(/\t/g, " ")).join("\t")
    ),
  ].join("\n");

  // Add BOM for Excel to recognize UTF-8
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + tsvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `sales_export_${format(new Date(), "yyyy-MM-dd")}.xls`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
