
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { printReceipt, PrintReceiptProps, PrintError, openPrintWindow } from '@/utils/receiptPrinter';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { logPrintAnalytics } from '@/utils/printAnalytics';

export const useReceiptReprint = () => {
  const { toast } = useToast();
  const { settings: storeSettings, isLoading: isLoadingSettings } = useStoreSettings();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAndPreviewReceipt = useCallback(async (saleId: string, windowRef?: Window | null) => {
    if (isLoadingSettings) {
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
      let receiptData: any = null;

      // 1. Try to fetch from 'receipts' table
      const { data: storedReceipt, error: fetchError } = await supabase
        .from('receipts')
        .select('receipt_data')
        .eq('sale_id', saleId)
        .maybeSingle();

      if (fetchError) {
        console.warn('Error fetching from receipts table:', fetchError);
      }

      if (storedReceipt?.receipt_data) {
        receiptData = typeof storedReceipt.receipt_data === 'string'
          ? JSON.parse(storedReceipt.receipt_data)
          : storedReceipt.receipt_data;
      } else {
        // 2. FALLBACK: Reconstruct from 'sales' and 'sales_items'
        console.log('Receipt record not found, attempting reconstruction from sales data...');
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .select('*, sales_items(*)')
          .eq('id', saleId)
          .maybeSingle();

        if (saleError) throw saleError;
        if (!sale) throw new Error('Sale record not found');

        // Map database record to PrintReceiptProps
        receiptData = {
          saleId: sale.id,
          transactionId: sale.transaction_id,
          date: sale.created_at ? new Date(sale.created_at) : new Date(),
          total: sale.total,
          discount: sale.discount || 0,
          manualDiscount: (sale as any).manual_discount || 0,
          customerName: sale.customer_name,
          customerPhone: sale.customer_phone,
          businessName: sale.business_name,
          businessAddress: sale.business_address,
          saleType: sale.sale_type,
          dispenserName: sale.cashier_name,
          dispenserEmail: sale.cashier_email,
          dispenserId: sale.cashier_id,
          items: (sale.sales_items || []).map((item: any) => ({
            id: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            unitPrice: item.unit_price,
            total: item.total,
            discount: item.discount,
            isWholesale: item.is_wholesale
          }))
        };
      }

      if (receiptData) {
        // Clean the receipt data
        const cleanReceiptData = JSON.parse(JSON.stringify(receiptData), (key, value) => {
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

        // CRITICAL FIX: Ensure storeSettings is never passed as undefined/null to printing utility
        cleanReceiptData.storeSettings = storeSettings || {
          name: 'Pharmacy Store',
          address: null,
          phone: null,
          email: null,
          logo_url: null,
          print_show_logo: false,
          print_show_address: true,
          print_show_email: true,
          print_show_phone: true,
          print_show_footer: true
        };

        setPreviewData(cleanReceiptData);

        // If we have a window reference, it means the user wants to print directly
        if (windowRef) {
          await printReceipt(cleanReceiptData, windowRef);
        } else {
          setShowPreview(true);
        }
      } else {
        throw new Error('Could not retrieve receipt data');
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
  }, [toast, storeSettings, isLoadingSettings]);

  const executePrint = useCallback(async (customData?: PrintReceiptProps, windowRef?: Window | null) => {
    const dataToPrint = customData || previewData;
    if (!dataToPrint) return;

    const items = dataToPrint.items || [];
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
        dispenserId: dataToPrint.dispenserId,
        dispenserName: dataToPrint.dispenserName,
        customerName: dataToPrint.customerName,
        printStatus: 'success',
        printDurationMs: duration,
        isReprint: true,
        saleType: dataToPrint.saleType,
        totalAmount: items.reduce((sum, item) => sum + (item.total || 0), 0) - (dataToPrint.discount || 0) - (dataToPrint.manualDiscount || 0),
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

      // Defensive check for analytics to prevent secondary crashes in catch block
      await logPrintAnalytics({
        saleId: dataToPrint.saleId,
        dispenserId: dataToPrint.dispenserId,
        dispenserName: dataToPrint.dispenserName,
        customerName: dataToPrint.customerName,
        printStatus,
        errorType,
        errorMessage,
        printDurationMs: duration,
        isReprint: true,
        saleType: dataToPrint.saleType,
        totalAmount: items.reduce((sum, item) => sum + (item.total || 0), 0) - (dataToPrint.discount || 0) - (dataToPrint.manualDiscount || 0),
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
