import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReceiptReprint } from "@/hooks/sales/useReceiptReprint";
import { ReceiptPreview } from "@/components/receipts/ReceiptPreview";
import { RefundDialog } from "@/components/refunds/RefundDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useShift } from "@/hooks/useShift";
import { getCurrentShift } from "@/utils/shiftUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/EnhancedCard";
import { Printer, Receipt, Loader2, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ReceiptRecord {
  id: string;
  transaction_id: string;
  customer_name: string;
  business_name: string;
  cashier_name: string;
  total: number;
  discount: number;
  sale_type: string;
  created_at: string;
  manual_discount?: number;
  items_count?: number;
  cashier_id?: string;
  shift_name?: string;
}

const Receipts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeShift } = useShift();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedReceiptForRefund, setSelectedReceiptForRefund] = useState<ReceiptRecord | null>(null);

  const {
    fetchAndPreviewReceipt,
    executePrint,
    showPreview,
    setShowPreview,
    previewData,
    openPrintWindow
  } = useReceiptReprint();

  useEffect(() => {
    fetchReceipts();
  }, [user]);

  useEffect(() => {
    // RLS policies now handle transaction privacy at the database level
    // Display all receipts returned by the database query
    setFilteredReceipts(receipts);
  }, [receipts]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      // Fetch from sales table instead of receipts table
      // We join with sales_items to get the count
      const { data, error } = await supabase
        .from('sales')
        .select('*, sales_items(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReceipts: ReceiptRecord[] = (data || []).map((sale: any) => ({
        id: sale.id,
        transaction_id: sale.transaction_id,
        customer_name: sale.customer_name,
        business_name: sale.business_name,
        cashier_name: sale.cashier_name,
        total: Number(sale.total),
        discount: Number(sale.discount || 0),
        sale_type: sale.sale_type,
        created_at: sale.created_at,
        manual_discount: Number(sale.manual_discount || 0),
        items_count: sale.sales_items?.[0]?.count || 0,
        cashier_id: sale.cashier_id,
        shift_name: sale.shift_name
      }));

      setReceipts(formattedReceipts);
    } catch (error) {
      console.error("Error fetching receipts/sales:", error);
      toast({
        title: "Error",
        description: "Failed to load receipt history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewReceipt = (saleId: string) => {
    const windowRef = openPrintWindow();
    fetchAndPreviewReceipt(saleId, windowRef);
  };

  const handleRefundClick = (receipt: ReceiptRecord) => {
    setSelectedReceiptForRefund(receipt);
    setShowRefundDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <EnhancedCard colorScheme="primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt History
              </CardTitle>
              <CardDescription>
                View and reprint all stored receipts
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchReceipts} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Receipt className="h-16 w-16 mb-4 opacity-20" />
              <p>No receipts found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Sale Type</TableHead>
                    <TableHead>Customer/Business</TableHead>
                    <TableHead>Dispenser</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => {
                    const finalTotal = receipt.total;

                    return (
                      <TableRow key={receipt.id}>
                        <TableCell>
                          {format(new Date(receipt.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="capitalize">
                          {receipt.sale_type || 'retail'}
                        </TableCell>
                        <TableCell>
                          {receipt.business_name || receipt.customer_name || 'Walk-in'}
                        </TableCell>
                        <TableCell>
                          {receipt.cashier_name || 'Staff'}
                        </TableCell>
                        <TableCell>
                          {receipt.items_count || 0} item(s)
                        </TableCell>
                        <TableCell>
                          ₦{finalTotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreviewReceipt(receipt.id)}
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reprint Receipt</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRefundClick(receipt)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Refund Sale</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </EnhancedCard>

      {previewData && (
        <ReceiptPreview
          open={showPreview}
          onOpenChange={setShowPreview}
          receiptData={previewData}
          onPrint={() => {
            const windowRef = openPrintWindow();
            executePrint(undefined, windowRef);
          }}
        />
      )}

      {selectedReceiptForRefund && (
        <RefundDialog
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          saleId={selectedReceiptForRefund.id}
          transactionId={selectedReceiptForRefund.transaction_id || selectedReceiptForRefund.id}
          items={[]} // RefundDialog will need to fetch items or we fetch them here
          customerName={selectedReceiptForRefund.customer_name || selectedReceiptForRefund.business_name}
          originalAmount={selectedReceiptForRefund.total}
        />
      )}
    </div>
  );
};

export default Receipts;
