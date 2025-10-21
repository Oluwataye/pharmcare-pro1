
import { useToast } from '@/hooks/use-toast';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from '@/components/sales/ReceiptTemplate';

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
  const [receiptData, setReceiptData] = useState<HandlePrintOptions | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  const handlePrintCallback = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'Receipt',
    onAfterPrint: () => {
      console.log('Print completed successfully');
      toast({
        title: "Success",
        description: "Receipt sent to printer successfully",
      });
      setReceiptData(null);
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: "Failed to print receipt. Please check your printer connection.",
        variant: "destructive",
      });
      setReceiptData(null);
    },
  });

  const handlePrint = (options?: HandlePrintOptions) => {
    try {
      console.log("Starting print process with logo:", logoUrl);
      setReceiptData(options || null);
      
      // Wait for receipt data to be set, then trigger print
      setTimeout(() => {
        handlePrintCallback();
      }, 100);
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to print receipt. Please check your printer connection.",
        variant: "destructive",
      });
    }
  };

  return { 
    handlePrint, 
    receiptRef,
    receiptData,
    logoUrl
  };
};
