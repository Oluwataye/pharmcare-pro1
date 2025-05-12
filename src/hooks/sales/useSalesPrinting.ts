
import { useToast } from '@/hooks/use-toast';
import { printReceipt } from '@/utils/receiptPrinter';
import { SaleItem } from '@/types/sales';

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

  const handlePrint = async (options?: HandlePrintOptions) => {
    try {
      await printReceipt({
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
      });
      
      toast({
        title: "Success",
        description: "Receipt sent to printer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print receipt",
        variant: "destructive",
      });
    }
  };

  return { handlePrint };
};
