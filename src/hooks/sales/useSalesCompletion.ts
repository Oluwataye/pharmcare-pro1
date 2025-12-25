
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineData } from '@/hooks/useOfflineData';
import { SaleItem } from '@/types/sales';
import { customerInfoSchema, validateAndSanitize } from '@/lib/validation';
import { secureStorage } from '@/lib/secureStorage';
import { supabase } from '@/integrations/supabase/client';

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
      const transactionId = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const saleData = {
        items: [...items],
        total: calculateTotal(),
        discount: 0,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        businessName: options?.businessName,
        businessAddress: options?.businessAddress,
        cashierName: options?.cashierName,
        cashierEmail: options?.cashierEmail,
        cashierId: options?.cashierId,
        transactionId,
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
        // Complete sale online via edge function
        const { data, error } = await supabase.functions.invoke('complete-sale', {
          body: saleData
        });

        if (error) {
          throw new Error(error.message || 'Failed to complete sale');
        }

        if (!data.success) {
          throw new Error('Sale completion failed');
        }

        toast({
          title: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} Sale Completed`,
          description: `Transaction ID: ${data.transactionId}`,
        });

        // Clear the current sale data securely
        clearItems();
        clearDiscount();
        resetSaleType();
        secureStorage.removeItem('CURRENT_SALE_ITEMS');
        secureStorage.removeItem('CURRENT_SALE_DISCOUNT');
        secureStorage.removeItem('CURRENT_SALE_TYPE');

        // Return the sale ID from the response
        return data.saleId || true;
      }

      // For offline mode, clear and return true
      clearItems();
      clearDiscount();
      resetSaleType();
      secureStorage.removeItem('CURRENT_SALE_ITEMS');
      secureStorage.removeItem('CURRENT_SALE_DISCOUNT');
      secureStorage.removeItem('CURRENT_SALE_TYPE');

      // For offline mode, return transactionId so downstream logic triggers success modal
      return transactionId;
    } catch (error) {
      console.error('Sale completion error:', error);
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
