
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
  transactionId?: string; // Allow passing a pre-generated ID
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
      // Use provided ID or generate one
      const transactionId = options?.transactionId || `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
        try {
          // Complete sale online via edge function
          const { data, error } = await supabase.functions.invoke('complete-sale', {
            body: saleData
          });

          if (error) throw error;
          if (!data || !data.success) throw new Error('Sale completion failed');

          toast({
            title: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} Sale Completed`,
            description: `Transaction ID: ${data.transactionId}`,
          });

          // Cleanup
          clearItems();
          clearDiscount();
          resetSaleType();
          secureStorage.removeItem('CURRENT_SALE_ITEMS');
          secureStorage.removeItem('CURRENT_SALE_DISCOUNT');
          secureStorage.removeItem('CURRENT_SALE_TYPE');

          return data.saleId || true;

        } catch (onlineError) {
          console.warn('Online sale completion failed, falling back to offline mode:', onlineError);

          // Fallback to offline save
          createOfflineItem('sales', saleData);

          toast({
            title: "Saved Offline (Network Issue)",
            description: "Connection unstable. Sale saved offline and will sync automatically.",
            variant: "default" // Use default or specific variant for notice
          });

          // Cleanup
          clearItems();
          clearDiscount();
          resetSaleType();
          secureStorage.removeItem('CURRENT_SALE_ITEMS');
          secureStorage.removeItem('CURRENT_SALE_DISCOUNT');
          secureStorage.removeItem('CURRENT_SALE_TYPE');

          // Return transactionId so printing still happens!
          return transactionId;
        }
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
