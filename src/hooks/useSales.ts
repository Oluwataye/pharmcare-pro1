
import { useCartItems } from './sales/useCartItems';
import { useSaleDiscount } from './sales/useSaleDiscount';
import { useSaleType } from './sales/useSaleType';
import { useSalesPrinting } from './sales/useSalesPrinting';
import { useSalesCompletion } from './sales/useSalesCompletion';

interface UseSalesOptions {
  cashierName?: string;
  cashierEmail?: string;
  cashierId?: string;
}

export const useSales = (options?: UseSalesOptions) => {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    toggleItemPriceType,
    clearItems
  } = useCartItems();
  
  const {
    saleType,
    setSaleType: setSaleTypeMode,
    resetSaleType
  } = useSaleType();
  
  const {
    discount,
    setOverallDiscount,
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTotal,
    clearDiscount
  } = useSaleDiscount(items);
  
  const { handlePrint } = useSalesPrinting(items, discount, saleType);
  
  const { 
    completeSale: completeTransaction,
    isOfflineMode 
  } = useSalesCompletion(items, calculateTotal, clearItems, clearDiscount, resetSaleType);

  // Wrap the completeSale function to include cashier info from options
  const completeSale = async (completeSaleOptions?: Omit<Parameters<typeof completeTransaction>[0], 'cashierName' | 'cashierEmail' | 'cashierId'>) => {
    return completeTransaction({
      ...completeSaleOptions,
      cashierName: options?.cashierName,
      cashierEmail: options?.cashierEmail,
      cashierId: options?.cashierId,
    } as Parameters<typeof completeTransaction>[0]);
  };

  // Additional items handling callback
  const addWholesaleItem = (product: any, quantity: number) => {
    const isWholesale = addItem(product, quantity, true);
    if (isWholesale && saleType !== 'wholesale') {
      setSaleTypeMode('wholesale');
    }
    return isWholesale;
  };

  // Enhanced toggleItemPriceType with auto-type switching
  const enhancedToggleItemPriceType = (id: string) => {
    const isWholesale = toggleItemPriceType(id);
    if (isWholesale && saleType !== 'wholesale') {
      setSaleTypeMode('wholesale');
    }
    return isWholesale;
  };

  return {
    items,
    discount,
    saleType,
    addItem: (product: any, quantity: number, isWholesale: boolean = false) => {
      const result = addItem(product, quantity, isWholesale);
      if (result && saleType !== 'wholesale') {
        setSaleTypeMode('wholesale');
      }
      return result;
    },
    removeItem,
    updateQuantity,
    updateItemDiscount,
    toggleItemPriceType: enhancedToggleItemPriceType,
    setOverallDiscount,
    setSaleType: setSaleTypeMode,
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTotal,
    handlePrint,
    completeSale,
    clearItems: () => {
      clearItems();
      clearDiscount();
      resetSaleType();
    },
    isOfflineMode
  };
};

