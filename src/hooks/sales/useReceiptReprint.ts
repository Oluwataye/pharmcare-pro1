
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { printReceipt, PrintReceiptProps, PrintError, openPrintWindow } from '@/utils/receiptPrinter';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { logPrintAnalytics } from '@/utils/printAnalytics';

export const useReceiptReprint = () => {
  const { toast } = useToast();
  const { settings: storeSettings } = useStoreSettings();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndPreviewReceipt = useCallback(async (saleId: string, windowRef?: Window | null) => {
    if (!storeSettings && isLoading) {
      if (windowRef && !windowRef.closed) windowRef.close();
      toast({
        title: 'Settings Loading',
        description: 'Please wait for store settings to load...',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('receipt_data')
        .eq('sale_id', saleId)
        .single();

      if (error) throw error;

      if (data?.receipt_data) {
        // Clean the receipt data
        const cleanReceiptData = JSON.parse(JSON.stringify(data.receipt_data), (key, value) => {
          if (value && typeof value === 'object' && '_type' in value && 'value' in value) {
            return value.value;
          }
          if (value && typeof value === 'object' && '_type' in value && value._type === 'undefined') {
            return undefined;
          }
          return value;
        });

        // Validate date
        let receiptDate = new Date();
        if (cleanReceiptData.date) {
          const parsedDate = typeof cleanReceiptData.date === 'string'
            ? new Date(cleanReceiptData.date)
            : cleanReceiptData.date;

          if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
            receiptDate = parsedDate;
          }
        }
        cleanReceiptData.date = receiptDate;
        cleanReceiptData.storeSettings = storeSettings;

        setPreviewData(cleanReceiptData);

        // If we have a window reference, it means the user wants to print directly
        if (windowRef) {
          await printReceipt(cleanReceiptData, windowRef);
        } else {
          setShowPreview(true);
        }
      } else {
        throw new Error('Receipt data not found');
      }
    } catch (error: any) {
      if (windowRef && !windowRef.closed) windowRef.close();
      console.error('Error fetching receipt:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load receipt data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, storeSettings, isLoading]);

  const executePrint = useCallback(async (customData?: PrintReceiptProps, windowRef?: Window | null) => {
    const dataToPrint = customData || previewData;
    if (!dataToPrint) return;

    const startTime = Date.now();
    let printStatus: 'success' | 'failed' | 'cancelled' = 'success';
    let errorType: string | undefined;
    let errorMessage: string | undefined;

    try {
      const success = await printReceipt(dataToPrint, windowRef);

      if (!success) {
        printStatus = 'cancelled';
        throw new Error('Print operation failed');
      }

      const duration = Date.now() - startTime;

      await logPrintAnalytics({
        saleId: dataToPrint.saleId,
        cashierId: dataToPrint.cashierId,
        cashierName: dataToPrint.cashierName,
        customerName: dataToPrint.customerName,
        printStatus: 'success',
        printDurationMs: duration,
        isReprint: true,
        saleType: dataToPrint.saleType,
        totalAmount: dataToPrint.items.reduce((sum, item) => sum + item.total, 0) - (dataToPrint.discount || 0),
      });

      setShowPreview(false);
      toast({
        title: 'Receipt Printed',
        description: 'The receipt has been sent to the printer successfully.',
      });
    } catch (error: any) {
      console.error('Error printing receipt:', error);

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
        isReprint: true,
        saleType: dataToPrint.saleType,
        totalAmount: dataToPrint.items.reduce((sum, item) => sum + item.total, 0) - (dataToPrint.discount || 0),
      });

      toast({
        title: errorType === 'POPUP_BLOCKED' ? "Popup Blocked" : "Print Failed",
        description: errorMessage || "Failed to print receipt. Please try again.",
        variant: 'destructive',
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
    openPrintWindow
  };
};
