
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

  const {
    handlePrint,
    executePrint,
    showPreview,
    setShowPreview,
    previewData
  } = useSalesPrinting(items, discount, saleType);

  const {
    completeSale: completeTransaction,
    isOfflineMode
  } = useSalesCompletion(items, calculateTotal, clearItems, clearDiscount, resetSaleType);

  // Wrap the completeSale function to include cashier info from options
  const completeSale = async (completeSaleOptions?: Omit<Parameters<typeof completeTransaction>[0], 'cashierName' | 'cashierEmail' | 'cashierId'>) => {
    const result = await completeTransaction({
      ...completeSaleOptions,
      cashierName: options?.cashierName,
      cashierEmail: options?.cashierEmail,
      cashierId: options?.cashierId,
    } as Parameters<typeof completeTransaction>[0]);

    // If sale completed successfully and we have a sale ID, trigger print with the ID
    if (result && typeof result === 'string') {
      handlePrint({
        ...completeSaleOptions,
        cashierName: options?.cashierName,
        cashierEmail: options?.cashierEmail,
        cashierId: options?.cashierId,
        saleId: result
      });
    }

    return result;
  };

  // Additional items handling callback
  const addWholesaleItem = (product: any, quantity: number) => {
    const { success, usedWholesalePrice } = addItem(product, quantity, true);
    if (usedWholesalePrice && saleType !== 'wholesale') {
      setSaleTypeMode('wholesale');
    }
    return { success, usedWholesalePrice };
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
      const { success, usedWholesalePrice } = addItem(product, quantity, isWholesale);
      if (usedWholesalePrice && saleType !== 'wholesale') {
        setSaleTypeMode('wholesale');
      }
      return { success, usedWholesalePrice };
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
    executePrint,
    showPreview,
    setShowPreview,
    previewData,
    completeSale,
    clearItems: () => {
      clearItems();
      clearDiscount();
      resetSaleType();
    },
    isOfflineMode
  };
};

