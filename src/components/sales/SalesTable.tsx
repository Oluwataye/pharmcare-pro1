
import { Sale } from "@/types/sales";
import { useReceiptReprint } from "@/hooks/sales/useReceiptReprint";
import { ReceiptPreview } from "@/components/receipts/ReceiptPreview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Printer, Package } from "lucide-react";

interface SalesTableProps {
  sales: Sale[];
  showBusinessInfo?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const SalesTable = ({ 
  sales, 
  showBusinessInfo = false, 
  isLoading: isTableLoading = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
}: SalesTableProps) => {
  const {
    fetchAndPreviewReceipt,
    executePrint,
    showPreview,
    setShowPreview,
    previewData,
    isLoading: isReprintLoading,
  } = useReceiptReprint();

  const handleReprintReceipt = (saleId: string) => {
    fetchAndPreviewReceipt(saleId);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price (₦)</TableHead>
            <TableHead>Total (₦)</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Cashier</TableHead>
            {showBusinessInfo && <TableHead>Customer/Business</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isTableLoading ? (
            <TableRow>
              <TableCell colSpan={showBusinessInfo ? 10 : 9} className="h-24 text-center">
                Loading sales...
              </TableCell>
            </TableRow>
          ) : sales.length > 0 ? (
            sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.items[0]?.name || 'N/A'}{sale.items.length > 1 ? ` +${sale.items.length - 1} more` : ''}</TableCell>
                <TableCell>
                  {sale.saleType === 'wholesale' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Package className="h-3 w-3 mr-1" />
                      Wholesale
                    </Badge>
                  ) : (
                    <Badge variant="outline">Retail</Badge>
                  )}
                </TableCell>
                <TableCell>{sale.items[0]?.quantity || 0}</TableCell>
                <TableCell>{sale.items[0]?.price || 0}</TableCell>
                <TableCell>{sale.total}</TableCell>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.cashierName || 'Unknown'}</TableCell>
                {showBusinessInfo && (
                  <TableCell>
                    {sale.businessName || sale.customerName || 'Walk-in Customer'}
                  </TableCell>
                )}
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    sale.status === "completed" 
                      ? "bg-green-50 text-green-700" 
                      : sale.status === "cancelled"
                      ? "bg-red-50 text-red-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleReprintReceipt(sale.id)}
                    disabled={isReprintLoading}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showBusinessInfo ? 10 : 9} className="h-24 text-center">
                No sales found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    
    {previewData && (
      <ReceiptPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        receiptData={previewData}
        onPrint={executePrint}
      />
    )}

    {totalPages > 1 && (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} sales
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange?.(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )}
    </>
  );
};

export default SalesTable;
