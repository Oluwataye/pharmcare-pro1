import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt, PrintReceiptProps } from "@/utils/receiptPrinter";
import { useToast } from "@/hooks/use-toast";

export const useReceiptReprint = () => {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndPreviewReceipt = useCallback(async (saleId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('receipt_data')
        .eq('sale_id', saleId)
        .single();

      if (error) throw error;

      if (!data?.receipt_data) {
        throw new Error("Receipt data not found");
      }

      setPreviewData(data.receipt_data as unknown as PrintReceiptProps);
      setShowPreview(true);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      toast({
        title: "Error",
        description: "Failed to load receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const executePrint = useCallback(async () => {
    if (!previewData) return;

    try {
      const success = await printReceipt(previewData);

      if (!success) {
        throw new Error("Print operation failed");
      }

      setShowPreview(false);
      toast({
        title: "Receipt Reprinted",
        description: "The receipt has been sent to the printer successfully.",
      });
    } catch (error) {
      console.error("Error printing receipt:", error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Failed to print receipt. Please try again.",
        variant: "destructive",
      });
    }
  }, [previewData, toast]);

  return {
    fetchAndPreviewReceipt,
    executePrint,
    showPreview,
    setShowPreview,
    previewData,
    isLoading,
  };
};
