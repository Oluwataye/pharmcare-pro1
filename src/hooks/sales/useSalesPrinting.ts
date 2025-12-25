
import { useToast } from '@/hooks/use-toast';
import { printReceipt, PrintReceiptProps, PrintError } from '@/utils/receiptPrinter';
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
  items?: SaleItem[]; // Allow passing explicit items
  directPrint?: boolean; // Skip preview and print directly
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

  const executePrint = useCallback(async (customData?: PrintReceiptProps) => {
    const dataToPrint = customData || previewData;
    if (!dataToPrint) return;

    const startTime = Date.now();
    let printStatus: 'success' | 'failed' | 'cancelled' = 'success';
    let errorType: string | undefined;
    let errorMessage: string | undefined;

    try {
      const success = await printReceipt(dataToPrint);

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

      // Determine error type and status
      if (error?.type === PrintError.POPUP_BLOCKED) {
        printStatus = 'failed';
        errorType = 'POPUP_BLOCKED';
        errorMessage = "Popup blocked";
      } else if (error?.type === PrintError.IMAGE_LOAD_FAILED) {
        printStatus = 'failed';
        errorType = 'IMAGE_LOAD_FAILED';
        errorMessage = "Logo failed to load";
      } else if (error?.type === PrintError.WINDOW_LOAD_FAILED) {
        printStatus = 'failed';
        errorType = 'WINDOW_LOAD_FAILED';
        errorMessage = "Failed to load receipt content";
      } else if (error instanceof Error) {
        printStatus = 'failed';
        errorType = 'UNKNOWN';
        errorMessage = error.message;
      }

      const duration = Date.now() - startTime;

      // Log failed print
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

      // Provide specific error messages based on error type
      let displayMessage = "Failed to print receipt. Please try again.";
      let displayTitle = "Print Failed";

      if (error?.type === PrintError.POPUP_BLOCKED) {
        displayTitle = "Popup Blocked";
        displayMessage = "Please allow popups for this site and try again.";
      } else if (error?.type === PrintError.IMAGE_LOAD_FAILED) {
        displayTitle = "Image Load Failed";
        displayMessage = "Logo failed to load. Receipt will print without logo.";
      } else if (error?.type === PrintError.WINDOW_LOAD_FAILED) {
        displayTitle = "Load Failed";
        displayMessage = "Failed to load receipt content. Please check your connection.";
      } else if (error instanceof Error) {
        displayMessage = error.message;
      }

      toast({
        title: displayTitle,
        description: displayMessage,
        variant: "destructive",
      });
    }
  }, [previewData, toast]);

  const handlePrint = useCallback(async (options?: HandlePrintOptions) => {
    if (!storeSettings && isLoadingSettings) {
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
        cashierId: options?.saleId,
        saleId: options?.saleId,
        storeSettings: storeSettings!,
      };

      if (options?.directPrint) {
        await executePrint(receiptProps);
      } else {
        // Show preview first
        setPreviewData(receiptProps);
        setShowPreview(true);
      }

      // Save receipt data if saleId is provided
      if (options?.saleId) {
        await saveReceiptData(options.saleId, receiptProps);
      }
    } catch (error) {
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
    isLoadingSettings
  };
};
