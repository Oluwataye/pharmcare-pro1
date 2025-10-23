import { useToast } from '@/hooks/use-toast';
import { SaleItem } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from '@/components/sales/ReceiptTemplate';
import { thermalPrinterService } from '@/services/thermalPrinterService';

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
  const [useThermalPrinter, setUseThermalPrinter] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStoreLogo();
    checkThermalPrinterSupport();
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

  const checkThermalPrinterSupport = () => {
    if (navigator.usb) {
      setUseThermalPrinter(true);
    }
  };

  const handleThermalPrint = async (options?: HandlePrintOptions) => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Cannot print empty receipt",
        variant: "destructive",
      });
      return;
    }

    setIsPrinting(true);

    try {
      // Connect to thermal printer
      const connected = await thermalPrinterService.connect();
      if (!connected) {
        throw new Error('Failed to connect to thermal printer. Please ensure it is connected via USB.');
      }

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = subtotal * (discount / 100);
      const total = subtotal - discountAmount;

      const receiptData = {
        businessName: options?.customerInfo?.businessName || 'PharmCare Pro',
        businessAddress: options?.customerInfo?.businessAddress || '123 Main Street, Lagos',
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        discount: discountAmount,
        total,
        cashierName: options?.customerInfo?.cashierName,
        customerName: options?.customerInfo?.customerName,
        date: new Date().toLocaleString()
      };

      const printed = await thermalPrinterService.printReceipt(receiptData);
      
      if (printed) {
        toast({
          title: "Print Successful",
          description: "Receipt sent to thermal printer",
          variant: "default",
        });
      } else {
        throw new Error('Failed to print receipt');
      }
    } catch (error) {
      console.error('Thermal print error:', error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Failed to print using thermal printer. Please check connection.",
        variant: "destructive",
      });
      
      // Fallback to browser print
      handleBrowserPrint(options);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'PharmCare_Receipt',
    removeAfterPrint: true,
    onAfterPrint: () => {
      console.log('Browser print dialog closed');
      setReceiptData(null);
    },
    onPrintError: (error) => {
      console.error('Browser print error:', error);
      toast({
        title: "Print Error",
        description: "Failed to print via browser. Please check your printer settings.",
        variant: "destructive",
      });
      setReceiptData(null);
    },
  });

  const handlePrint = (options?: HandlePrintOptions) => {
    if (isPrinting) {
      toast({
        title: "Print in Progress",
        description: "Please wait for current print job to complete",
        variant: "default",
      });
      return;
    }

    if (useThermalPrinter) {
      handleThermalPrint(options);
    } else {
      // Fallback to browser printing
      try {
        setReceiptData(options || null);
        setTimeout(() => {
          handleBrowserPrint();
        }, 300);
      } catch (error) {
        console.error('Print process error:', error);
        toast({
          title: "Print Error",
          description: "Failed to initiate print process",
          variant: "destructive",
        });
      }
    }
  };

  return { 
    handlePrint, 
    receiptRef,
    receiptData,
    logoUrl,
    isPrinting,
    useThermalPrinter
  };
};
