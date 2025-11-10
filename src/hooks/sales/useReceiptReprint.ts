import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { printReceipt, PrintReceiptProps, PrintError } from '@/utils/receiptPrinter';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export const useReceiptReprint = () => {
  const { toast } = useToast();
  const { settings: storeSettings } = useStoreSettings();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndPreviewReceipt = useCallback(async (saleId: string) => {
    if (!storeSettings) {
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

    try {
      const success = await printReceipt(previewData);
      
      if (!success) {
        throw new Error('Print operation failed');
      }

      setShowPreview(false);
      toast({
        title: 'Receipt Printed',
        description: 'The receipt has been sent to the printer successfully.',
      });
    } catch (error: any) {
      console.error('Error printing receipt:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to print receipt. Please try again.";
      let errorTitle = "Print Failed";
      
      if (error?.type === PrintError.POPUP_BLOCKED) {
        errorTitle = "Popup Blocked";
        errorMessage = "Please allow popups for this site and try again.";
      } else if (error?.type === PrintError.IMAGE_LOAD_FAILED) {
        errorTitle = "Image Load Failed";
        errorMessage = "Logo failed to load. Receipt will print without logo.";
      } else if (error?.type === PrintError.WINDOW_LOAD_FAILED) {
        errorTitle = "Load Failed";
        errorMessage = "Failed to load receipt content. Please check your connection.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
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
