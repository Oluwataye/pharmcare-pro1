import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem } from '@/types/sales';
import { secureStorage } from '@/lib/secureStorage';

const DISCOUNT_STORAGE_KEY = 'CURRENT_SALE_DISCOUNT';
const MANUAL_DISCOUNT_STORAGE_KEY = 'CURRENT_SALE_MANUAL_DISCOUNT';

export const useSaleDiscount = (items: SaleItem[]) => {
  const [discount, setDiscount] = useState<number>(() => {
    const savedDiscount = secureStorage.getItem(DISCOUNT_STORAGE_KEY);
    return savedDiscount !== null ? savedDiscount : 0;
  });

  const [manualDiscount, setManualDiscountAmount] = useState<number>(() => {
    const savedManual = secureStorage.getItem(MANUAL_DISCOUNT_STORAGE_KEY);
    return savedManual !== null ? savedManual : 0;
  });

  const { toast } = useToast();

  // Save the discount to secure storage whenever it changes
  useEffect(() => {
    secureStorage.setItem(DISCOUNT_STORAGE_KEY, discount);
  }, [discount]);

  useEffect(() => {
    secureStorage.setItem(MANUAL_DISCOUNT_STORAGE_KEY, manualDiscount);
  }, [manualDiscount]);

  const setOverallDiscount = (value: number) => {
    if (value < 0 || value > 100) {
      toast({
        title: "Error",
        description: "Discount must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    setDiscount(value);
  };

  const setManualDiscount = (amount: number) => {
    // Allow any amount during entry to prevent disruptive toasts while typing
    // Validation will be enforced at the UI level and before completing the sale
    setManualDiscountAmount(amount);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    const percentDiscount = (subtotal * discount / 100);
    const itemDiscounts = items.reduce((sum, item) =>
      sum + (item.price * item.quantity * ((item.discount || 0) / 100)), 0);

    return percentDiscount + itemDiscounts + manualDiscount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subtotal - discountAmount);
  };

  return {
    discount,
    manualDiscount,
    setOverallDiscount,
    setManualDiscount,
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTotal,
    clearDiscount: () => {
      setDiscount(0);
      setManualDiscountAmount(0);
    }
  };
};

