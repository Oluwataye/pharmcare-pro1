
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineData } from '@/hooks/useOfflineData';
import { SaleItem } from '@/types/sales';
import { customerInfoSchema, validateAndSanitize } from '@/lib/validation';
import { secureStorage } from '@/lib/secureStorage';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentShift } from '@/utils/shiftUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useShift } from '../useShift';
import { useInventory } from '../useInventory';

interface CompleteSaleOptions {
  customerName?: string;
  customerPhone?: string;
  businessName?: string;
  businessAddress?: string;
  saleType: 'retail' | 'wholesale';
  dispenserName?: string;
  dispenserEmail?: string;
  dispenserId?: string;
  staffRole?: string;
  transactionId?: string; // Allow passing a pre-generated ID
  shift_id?: string;
  payments?: { mode: string, amount: number }[];
}

export const useSalesCompletion = (
  items: SaleItem[],
  calculateTotal: () => number,
  clearItems: () => void,
  clearDiscount: () => void,
  resetSaleType: () => void,
  discount: number = 0, // Add discount percentage
  manualDiscount: number = 0 // Add manual discount amount
) => {
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const { createOfflineItem } = useOfflineData();
  const { activeShift, startShift } = useShift();
  const { user } = useAuth();
  const { inventory } = useInventory(); // Get current cost prices from inventory

  const completeSale = async (options?: CompleteSaleOptions) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Cannot complete sale with no items",
        variant: "destructive",
      });
      return false;
    }

    // MANDATORY SHIFT CHECK (Configurable in future, but enforced now for integrity)
    if (!activeShift) {
      toast({
        title: "Drawer Closed",
        description: "You must start a shift and enter an opening balance before recording sales.",
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
        items: items.map(item => {
          // Find current cost_price from inventory if available
          const invItem = inventory?.find((i: any) => i.id === item.product_id);
          return {
            ...item,
            cost_price: invItem?.cost_price || 0 // Capture for P&L COGS
          };
        }),
        total: calculateTotal(),
        discount: discount, // Use actual discount percentage
        manualDiscount: manualDiscount, // Include manual discount amount
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        businessName: options?.businessName,
        businessAddress: options?.businessAddress,
        dispenserName: options?.dispenserName || user?.name || user?.email?.split('@')[0] || 'Staff',
        dispenserEmail: options?.dispenserEmail || user?.email,
        dispenserId: options?.dispenserId || user?.id,
        transactionId,
        saleType: currentSaleType,
        shift_name: activeShift?.shift_type || getCurrentShift(),
        shift_id: options?.shift_id || activeShift?.id,
        branch_id: user?.branch_id, // Attribute sale to user's branch
        staff_role: options?.staffRole || user?.role,
        payments: options?.payments
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
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          const { data, error } = await supabase.functions.invoke('complete-sale', {
            body: {
              ...saleData,
              _tunneled_token: token // Use body tunnel for direct calls too
            },
            headers: {
              Authorization: `Bearer ${anonKey}` // Satisfy Gateway with Anon Key
            }
          });

          if (error) throw error;
          if (!data || !data.success) throw new Error('Sale completion failed');

          toast({
            title: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} Sale Completed`,
            description: `Transaction ID: ${data.transactionId}`,
          });

          // Cleanup
          console.log('useSalesCompletion: Sale success, clearing items...');
          clearItems();
          clearDiscount();
          resetSaleType();
          secureStorage.removeItem('CURRENT_SALE_ITEMS');
          secureStorage.removeItem('CURRENT_SALE_DISCOUNT');
          secureStorage.removeItem('CURRENT_SALE_MANUAL_DISCOUNT');
          secureStorage.removeItem('CURRENT_SALE_TYPE');
          console.log('useSalesCompletion: Items cleared');

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
          secureStorage.removeItem('CURRENT_SALE_MANUAL_DISCOUNT');
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
      secureStorage.removeItem('CURRENT_SALE_MANUAL_DISCOUNT');
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
