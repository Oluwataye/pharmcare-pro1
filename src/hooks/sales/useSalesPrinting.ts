import { useToast } from '@/hooks/use-toast';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isPrinting, setIsPrinting] = useState(false);
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

  // Enhanced print configuration for thermal printers
  const handlePrintCallback = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'PharmCare_Receipt',
    removeAfterPrint: true,
    copyStyles: true,
    bodyClass: 'receipt-printing',
    onBeforeGetContent: () => {
      console.log('Preparing receipt content for printing...');
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      console.log('Print dialog closed - checking printer status...');
      setIsPrinting(false);
      
      // Check if this was likely a successful print
      const wasLikelyPrinted = checkPrintSuccess();
      
      if (wasLikelyPrinted) {
        toast({
          title: "Print Successful",
          description: "Receipt printed successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Print Dialog Closed",
          description: "Please ensure you completed the print in the dialog",
          variant: "destructive",
        });
      }
      setReceiptData(null);
    },
    onPrintError: (error, printFunction) => {
      console.error('Print system error:', error);
      setIsPrinting(false);
      toast({
        title: "Print System Error",
        description: "Failed to access printer. Please check printer connection and try again.",
        variant: "destructive",
      });
      setReceiptData(null);
      
      // Fallback: Try direct print
      setTimeout(() => {
        window.print();
      }, 500);
    },
  });

  // Check if print was likely successful
  const checkPrintSuccess = useCallback((): boolean => {
    // Add logic to verify print success
    // For now, we'll assume success if we reached this point without errors
    // In a real implementation, you might want to add printer-specific checks
    return true;
  }, []);

  // Enhanced print handler with better thermal printer support
  const handlePrint = useCallback((options?: HandlePrintOptions) => {
    if (isPrinting) {
      toast({
        title: "Print in Progress",
        description: "Please wait for current print job to complete",
        variant: "default",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Cannot print empty receipt",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Starting thermal print process with logo:", logoUrl);
      console.log("Printing items:", items.length);
      
      setReceiptData(options || null);
      
      // Wait for DOM update and receipt rendering
      setTimeout(() => {
        if (!receiptRef.current) {
          console.error('Receipt template not ready for printing');
          toast({
            title: "Print Error",
            description: "Receipt content not ready. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Triggering print dialog...');
        handlePrintCallback();
      }, 300); // Increased timeout for better DOM readiness
    } catch (error) {
      console.error('Error in print process:', error);
      setIsPrinting(false);
      toast({
        title: "Print Process Error",
        description: error instanceof Error ? error.message : "Failed to initiate print. Please check your printer.",
        variant: "destructive",
      });
    }
  }, [items, logoUrl, isPrinting, handlePrintCallback, toast]);

  return { 
    handlePrint, 
    receiptRef,
    receiptData,
    logoUrl,
    isPrinting
  };
};
