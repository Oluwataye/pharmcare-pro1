import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReceiptReprint } from "@/hooks/sales/useReceiptReprint";
import { ReceiptPreview } from "@/components/receipts/ReceiptPreview";
import { RefundDialog } from "@/components/refunds/RefundDialog";
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
  sale_id: string;
  receipt_data: any;
  created_at: string;
}

const Receipts = () => {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
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
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast({
        title: "Error",
        description: "Failed to load receipts. Please try again.",
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
          ) : receipts.length === 0 ? (
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
                  {receipts.map((receipt) => {
                    const data = typeof receipt.receipt_data === 'string'
                      ? JSON.parse(receipt.receipt_data)
                      : receipt.receipt_data;

                    if (!data) return null;

                    const total = data.total || data.items?.reduce(
                      (sum: number, item: any) => sum + (item.price || item.unit_price) * item.quantity,
                      0
                    ) || 0;
                    const discount = data.discount || 0;
                    const finalTotal = total - (total * (discount / 100));

                    return (
                      <TableRow key={receipt.id}>
                        <TableCell>
                          {format(new Date(receipt.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="capitalize">
                          {data.saleType || 'retail'}
                        </TableCell>
                        <TableCell>
                          {data.businessName || data.customerName || 'Walk-in'}
                        </TableCell>
                        <TableCell>
                          {data.dispenserName || data.cashierName || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {data.items?.length || 0} item(s)
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
                                    onClick={() => handlePreviewReceipt(receipt.sale_id)}
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
        (() => {
          const data = typeof selectedReceiptForRefund.receipt_data === 'string'
            ? JSON.parse(selectedReceiptForRefund.receipt_data)
            : selectedReceiptForRefund.receipt_data;

          if (!data) return null;

          const total = data.total || data.items?.reduce(
            (sum: number, item: any) => sum + (item.price || item.unit_price) * item.quantity,
            0
          ) || 0;
          const discount = data.discount || 0;
          const finalTotal = total - (total * (discount / 100));

          return (
            <RefundDialog
              open={showRefundDialog}
              onOpenChange={setShowRefundDialog}
              saleId={selectedReceiptForRefund.sale_id}
              transactionId={data.transactionId || selectedReceiptForRefund.id}
              items={data.items || []}
              customerName={data.customerName || data.businessName}
              originalAmount={finalTotal}
            />
          );
        })()
      )}
    </div>
  );
};

export default Receipts;
