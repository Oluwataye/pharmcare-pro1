import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem } from '@/types/sales';
import { secureStorage } from '@/lib/secureStorage';

const DISCOUNT_STORAGE_KEY = 'CURRENT_SALE_DISCOUNT';

export const useSaleDiscount = (items: SaleItem[]) => {
  const [discount, setDiscount] = useState<number>(() => {
    const savedDiscount = secureStorage.getItem(DISCOUNT_STORAGE_KEY);
    return savedDiscount !== null ? savedDiscount : 0;
  });

  const { toast } = useToast();

  // Save the discount to secure storage whenever it changes
  useEffect(() => {
    secureStorage.setItem(DISCOUNT_STORAGE_KEY, discount);
  }, [discount]);

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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * discount / 100) + items.reduce((sum, item) => 
      sum + (item.price * item.quantity * ((item.discount || 0) / 100)), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return subtotal - discountAmount;
  };

  return {
    discount,
    setOverallDiscount,
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTotal,
    clearDiscount: () => setDiscount(0)
  };
};

