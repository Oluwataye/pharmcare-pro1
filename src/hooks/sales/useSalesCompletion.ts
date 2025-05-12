
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineData } from '@/hooks/useOfflineData';
import { SaleItem } from '@/types/sales';

interface CompleteSaleOptions {
  customerName?: string;
  customerPhone?: string;
  businessName?: string;
  businessAddress?: string;
  saleType: 'retail' | 'wholesale';
  cashierName?: string;
  cashierEmail?: string;
  cashierId?: string;
}

export const useSalesCompletion = (
  items: SaleItem[], 
  calculateTotal: () => number,
  clearItems: () => void,
  clearDiscount: () => void,
  resetSaleType: () => void
) => {
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const { createOfflineItem } = useOfflineData();

  const completeSale = async (options?: CompleteSaleOptions) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Cannot complete sale with no items",
        variant: "destructive",
      });
      return false;
    }

    try {
      const currentSaleType = options?.saleType || 'retail';
      
      const saleData = {
        items: [...items],
        total: calculateTotal(),
        date: new Date().toISOString(),
        status: 'completed',
        discount: 0, // This would need to be passed from the parent hook
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        businessName: options?.businessName,
        businessAddress: options?.businessAddress,
        cashierName: options?.cashierName,
        cashierEmail: options?.cashierEmail,
        cashierId: options?.cashierId,
        transactionId: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        saleType: currentSaleType
      };

      // If offline, save this sale for later sync
      if (!isOnline) {
        createOfflineItem('sales', saleData);
        toast({
          title: "Offline Sale Completed",
          description: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} sale has been saved offline and will sync when you're back online`,
        });
      } else {
        // In online mode, would normally send to server
        // For now, just store locally
        const savedSales = localStorage.getItem('COMPLETED_SALES');
        const sales = savedSales ? JSON.parse(savedSales) : [];
        sales.push(saleData);
        localStorage.setItem('COMPLETED_SALES', JSON.stringify(sales));
        
        toast({
          title: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} Sale Completed`,
          description: "Sale has been successfully recorded",
        });
      }
      
      // Clear the current sale
      clearItems();
      clearDiscount();
      resetSaleType();
      localStorage.removeItem('CURRENT_SALE_ITEMS');
      localStorage.removeItem('CURRENT_SALE_DISCOUNT');
      localStorage.removeItem('CURRENT_SALE_TYPE');
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete sale",
        variant: "destructive",
      });
      return false;
    }
  };

  return { completeSale, isOfflineMode: !isOnline };
};
