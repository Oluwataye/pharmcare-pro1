
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
      console.log("Starting print process with logo:", logoUrl);
      
      const success = await printReceipt({
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
      
      if (success) {
        toast({
          title: "Success",
          description: "Receipt sent to printer successfully",
        });
      } else {
        throw new Error("Print operation failed");
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to print receipt. Please check your printer connection.",
        variant: "destructive",
      });
      throw error; // Re-throw to let caller handle it
    }
  };

  return { handlePrint };
};
