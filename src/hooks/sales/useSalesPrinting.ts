
import { useToast } from '@/hooks/use-toast';
import { printReceipt, PrintReceiptProps, PrintError, openPrintWindow } from '@/utils/receiptPrinter';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { logPrintAnalytics } from '@/utils/printAnalytics';

interface HandlePrintOptions {
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  cashierEmail?: string;
  businessName?: string;
  businessAddress?: string;
  cashierId?: string;
  saleId?: string;
  items?: SaleItem[];
  directPrint?: boolean;
  existingWindow?: Window | null; // Pass an already opened window to preserve user gesture
}

export const useSalesPrinting = (
  items: SaleItem[],
  discount: number,
  saleType: 'retail' | 'wholesale'
) => {
  const { toast } = useToast();
  const { settings: storeSettings, isLoading: isLoadingSettings } = useStoreSettings();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);

  const saveReceiptData = useCallback(async (saleId: string, receiptProps: PrintReceiptProps) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .insert([{
          sale_id: saleId,
          receipt_data: receiptProps as any
        }]);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving receipt data:", error);
    }
  }, []);

  const executePrint = useCallback(async (customData?: PrintReceiptProps, windowRef?: Window | null) => {
    const dataToPrint = customData || previewData;
    if (!dataToPrint) return;

    const startTime = Date.now();
    let printStatus: 'success' | 'failed' | 'cancelled' = 'success';
    let errorType: string | undefined;
    let errorMessage: string | undefined;

    try {
      // Use the provided windowRef if available, otherwise printReceipt will try to open a new one
      const success = await printReceipt(dataToPrint, windowRef);

      if (!success) {
        printStatus = 'cancelled';
        throw new Error("Print operation failed");
      }

      const duration = Date.now() - startTime;

      // Log successful print
      await logPrintAnalytics({
        saleId: dataToPrint.saleId,
        cashierId: dataToPrint.cashierId,
        cashierName: dataToPrint.cashierName,
        customerName: dataToPrint.customerName,
        printStatus: 'success',
        printDurationMs: duration,
        isReprint: false,
        saleType: dataToPrint.saleType,
        totalAmount: dataToPrint.items.reduce((sum, item) => sum + item.total, 0) - (dataToPrint.discount || 0),
      });

      setShowPreview(false);
      toast({
        title: "Receipt Printed",
        description: "The receipt has been sent to the printer successfully.",
      });
    } catch (error: any) {
      console.error("Error printing receipt:", error);

      if (error?.type === PrintError.POPUP_BLOCKED) {
        printStatus = 'failed';
        errorType = 'POPUP_BLOCKED';
        errorMessage = "Popup blocked";
      } else if (error instanceof Error) {
        printStatus = 'failed';
        errorType = 'UNKNOWN';
        errorMessage = error.message;
      }

      const duration = Date.now() - startTime;

      await logPrintAnalytics({
        saleId: dataToPrint.saleId,
        cashierId: dataToPrint.cashierId,
        cashierName: dataToPrint.cashierName,
        customerName: dataToPrint.customerName,
        printStatus,
        errorType,
        errorMessage,
        printDurationMs: duration,
        isReprint: false,
        saleType: dataToPrint.saleType,
        totalAmount: dataToPrint.items.reduce((sum, item) => sum + item.total, 0) - (dataToPrint.discount || 0),
      });

      toast({
        title: errorType === 'POPUP_BLOCKED' ? "Popup Blocked" : "Print Failed",
        description: errorMessage || "Failed to print receipt. Please try again.",
        variant: "destructive",
      });
    }
  }, [previewData, toast]);

  const handlePrint = useCallback(async (options?: HandlePrintOptions) => {
    // If we're doing a direct print (e.g. after sale completion), we should ideally
    // have a window reference passed in to avoid gesture blocks.
    const windowRef = options?.existingWindow;

    if (!storeSettings && isLoadingSettings) {
      if (windowRef && !windowRef.closed) windowRef.close();
      toast({
        title: "Settings Loading",
        description: "Please wait for store settings to load...",
        variant: "destructive",
      });
      return;
    }

    try {
      const receiptProps: PrintReceiptProps = {
        items: options?.items || items,
        discount,
        date: new Date(),
        cashierName: options?.cashierName || undefined,
        cashierEmail: options?.cashierEmail || undefined,
        customerName: options?.customerName || undefined,
        customerPhone: options?.customerPhone || undefined,
        businessName: options?.businessName || undefined,
        businessAddress: options?.businessAddress || undefined,
        saleType,
        cashierId: options?.cashierId || undefined,
        saleId: options?.saleId,
        storeSettings: storeSettings!,
      };

      if (options?.directPrint) {
        await executePrint(receiptProps, windowRef);
      } else {
        // Show preview first (User will trigger executePrint from the preview manually)
        setPreviewData(receiptProps);
        setShowPreview(true);
      }

      if (options?.saleId) {
        await saveReceiptData(options.saleId, receiptProps);
      }
    } catch (error) {
      if (windowRef && !windowRef.closed) windowRef.close();
      console.error("Error preparing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to prepare receipt. Please try again.",
        variant: "destructive",
      });
    }
  }, [items, discount, saleType, storeSettings, isLoadingSettings, toast, saveReceiptData, executePrint]);

  return {
    handlePrint,
    executePrint,
    showPreview,
    setShowPreview,
    previewData,
    isLoadingSettings,
    openPrintWindow // Export this so components can open the window synchronously
  };
};
