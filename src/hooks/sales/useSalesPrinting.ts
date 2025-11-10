
import { useToast } from '@/hooks/use-toast';
import { printReceipt, PrintReceiptProps, PrintError } from '@/utils/receiptPrinter';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface HandlePrintOptions {
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  cashierEmail?: string;
  businessName?: string;
  businessAddress?: string;
  cashierId?: string;
  saleId?: string;
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

  const handlePrint = useCallback(async (options?: HandlePrintOptions) => {
    if (!storeSettings) {
      toast({
        title: "Settings Loading",
        description: "Please wait for store settings to load...",
        variant: "destructive",
      });
      return;
    }

    try {
      const receiptProps: PrintReceiptProps = {
        items,
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
        storeSettings,
      };
      
      // Show preview first
      setPreviewData(receiptProps);
      setShowPreview(true);
      
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
  }, [items, discount, saleType, storeSettings, toast, saveReceiptData]);

  const executePrint = useCallback(async () => {
    if (!previewData) return;
    
    try {
      const success = await printReceipt(previewData);
      
      if (!success) {
        throw new Error("Print operation failed");
      }
      
      setShowPreview(false);
      toast({
        title: "Receipt Printed",
        description: "The receipt has been sent to the printer successfully.",
      });
    } catch (error: any) {
      console.error("Error printing receipt:", error);
      
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
        variant: "destructive",
      });
    }
  }, [previewData, toast]);

  return { 
    handlePrint, 
    executePrint,
    showPreview, 
    setShowPreview, 
    previewData,
    isLoadingSettings
  };
};
