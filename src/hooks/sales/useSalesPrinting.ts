
import { useToast } from '@/hooks/use-toast';
import { printReceipt } from '@/utils/receiptPrinter';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface HandlePrintOptions {
  customerInfo?: {
    customerName?: string;
    customerPhone?: string;
    cashierName?: string;
    cashierEmail?: string;
    businessName?: string;
    businessAddress?: string;
    cashierId?: string;
  };
}

export const useSalesPrinting = (
  items: SaleItem[],
  discount: number,
  saleType: 'retail' | 'wholesale'
) => {
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string>('');

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

  const handlePrint = async (options?: HandlePrintOptions) => {
    try {
      console.log('Printing receipt', {
        items,
        discount,
        cashierName: options?.customerInfo?.cashierName,
        cashierEmail: options?.customerInfo?.cashierEmail,
        customerName: options?.customerInfo?.customerName,
        customerPhone: options?.customerInfo?.customerPhone,
        businessName: options?.customerInfo?.businessName,
        businessAddress: options?.customerInfo?.businessAddress,
        saleType,
        date: new Date(),
        cashierId: options?.customerInfo?.cashierId,
        logoUrl,
      });

      const printSuccess = await printReceipt({
        items,
        discount,
        cashierName: options?.customerInfo?.cashierName,
        cashierEmail: options?.customerInfo?.cashierEmail,
        customerName: options?.customerInfo?.customerName,
        customerPhone: options?.customerInfo?.customerPhone,
        businessName: options?.customerInfo?.businessName,
        businessAddress: options?.customerInfo?.businessAddress,
        saleType,
        date: new Date(),
        cashierId: options?.customerInfo?.cashierId,
        logoUrl,
      });

      if (!printSuccess) {
        throw new Error("Print dialog was closed or blocked. Please check your browser's popup settings.");
      }
      
      toast({
        title: "Success",
        description: "Receipt sent to printer successfully",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Failed to print receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handlePrint };
};
