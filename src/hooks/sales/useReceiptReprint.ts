import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { printReceipt, PrintReceiptProps, PrintError } from '@/utils/receiptPrinter';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { logPrintAnalytics } from '@/utils/printAnalytics';

export const useReceiptReprint = () => {
  const { toast } = useToast();
  const { settings: storeSettings } = useStoreSettings();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndPreviewReceipt = useCallback(async (saleId: string) => {
    if (!storeSettings && isLoading) {
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
        // Clean the receipt data to remove any _type metadata
        const cleanReceiptData = JSON.parse(JSON.stringify(data.receipt_data), (key, value) => {
          // If the value is an object with _type and value properties, extract the value
          if (value && typeof value === 'object' && '_type' in value && 'value' in value) {
            return value.value;
          }
          // If it's explicitly undefined with _type metadata, return undefined
          if (value && typeof value === 'object' && '_type' in value && value._type === 'undefined') {
            return undefined;
          }
          return value;
        });

        // Validate and ensure date is a valid Date object
        let receiptDate = new Date();
        if (cleanReceiptData.date) {
          const parsedDate = typeof cleanReceiptData.date === 'string'
            ? new Date(cleanReceiptData.date)
            : cleanReceiptData.date;

          // Check if date is valid
          if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
            receiptDate = parsedDate;
          }
        }
        cleanReceiptData.date = receiptDate;

        // Update store settings to current settings
        cleanReceiptData.storeSettings = storeSettings;

        setPreviewData(cleanReceiptData);
        setShowPreview(true);
      } else {
        throw new Error('Receipt data not found');
      }
    } catch (error: any) {
      console.error('Error fetching receipt:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load receipt data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, storeSettings]);

  const executePrint = useCallback(async () => {
    if (!previewData) return;

    const startTime = Date.now();
    let printStatus: 'success' | 'failed' | 'cancelled' = 'success';
    let errorType: string | undefined;
    let errorMessage: string | undefined;

    try {
      const success = await printReceipt(previewData);

      if (!success) {
        printStatus = 'cancelled';
        throw new Error('Print operation failed');
      }

      const duration = Date.now() - startTime;

      // Log successful reprint
      await logPrintAnalytics({
        saleId: previewData.saleId,
        cashierId: previewData.cashierId,
        cashierName: previewData.cashierName,
        customerName: previewData.customerName,
        printStatus: 'success',
        printDurationMs: duration,
        isReprint: true,
        saleType: previewData.saleType,
        totalAmount: previewData.items.reduce((sum, item) => sum + item.total, 0) - (previewData.discount || 0),
      });

      setShowPreview(false);
      toast({
        title: 'Receipt Printed',
        description: 'The receipt has been sent to the printer successfully.',
      });
    } catch (error: any) {
      console.error('Error printing receipt:', error);

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

      // Log failed reprint
      await logPrintAnalytics({
        saleId: previewData.saleId,
        cashierId: previewData.cashierId,
        cashierName: previewData.cashierName,
        customerName: previewData.customerName,
        printStatus,
        errorType,
        errorMessage,
        printDurationMs: duration,
        isReprint: true,
        saleType: previewData.saleType,
        totalAmount: previewData.items.reduce((sum, item) => sum + item.total, 0) - (previewData.discount || 0),
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
  };
};
