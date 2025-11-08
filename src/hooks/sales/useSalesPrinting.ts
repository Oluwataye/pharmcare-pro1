
import { useToast } from '@/hooks/use-toast';
import { printReceipt, PrintReceiptProps } from '@/utils/receiptPrinter';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';

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
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintReceiptProps | null>(null);

  useEffect(() => {
    fetchStoreLogo();
  }, []);

  const fetchStoreLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('logo_url')
        .single();

      if (error) throw error;
      if (data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    } catch (error) {
      console.error('Error fetching store logo:', error);
    }
  };

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
        logoUrl,
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
  }, [items, discount, saleType, logoUrl, toast, saveReceiptData]);

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
    handlePrint, 
    executePrint,
    showPreview, 
    setShowPreview, 
    previewData 
  };
};
