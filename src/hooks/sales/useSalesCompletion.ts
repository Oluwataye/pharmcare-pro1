
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineData } from '@/hooks/useOfflineData';
import { SaleItem } from '@/types/sales';
import { customerInfoSchema, validateAndSanitize } from '@/lib/validation';
import { secureStorage } from '@/lib/secureStorage';

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
      // Validate customer information
      if (options) {
        const customerValidation = validateAndSanitize(customerInfoSchema, {
          customerName: options.customerName,
          customerPhone: options.customerPhone,
          businessName: options.businessName,
          businessAddress: options.businessAddress
        });

        if (!customerValidation.success) {
          toast({
            title: "Validation Error",
            description: customerValidation.error,
            variant: "destructive",
          });
          return false;
        }
      }

      const currentSaleType = options?.saleType || 'retail';
      
      const saleData = {
        items: [...items],
        total: calculateTotal(),
        date: new Date().toISOString(),
        status: 'completed',
        discount: 0,
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
        // Store completed sales securely
        const existingSales = secureStorage.getItem('COMPLETED_SALES') || [];
        existingSales.push(saleData);
        secureStorage.setItem('COMPLETED_SALES', existingSales);
        
        toast({
          title: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} Sale Completed`,
          description: "Sale has been successfully recorded",
        });
      }
      
      // Clear the current sale data securely
      clearItems();
      clearDiscount();
      resetSaleType();
      secureStorage.removeItem('CURRENT_SALE_ITEMS');
      secureStorage.removeItem('CURRENT_SALE_DISCOUNT');
      secureStorage.removeItem('CURRENT_SALE_TYPE');
      
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
