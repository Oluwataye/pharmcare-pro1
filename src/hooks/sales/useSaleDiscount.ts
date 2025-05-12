
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem } from '@/types/sales';

export const useSaleDiscount = (items: SaleItem[]) => {
  const [discount, setDiscount] = useState<number>(() => {
    const savedDiscount = localStorage.getItem('CURRENT_SALE_DISCOUNT');
    return savedDiscount ? parseFloat(savedDiscount) : 0;
  });

  const { toast } = useToast();

  // Save the discount to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('CURRENT_SALE_DISCOUNT', discount.toString());
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

