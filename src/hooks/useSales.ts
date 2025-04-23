
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem, Product } from '@/types/sales';
import { printReceipt } from '@/utils/receiptPrinter';

interface UseSalesOptions {
  cashierName?: string;
  cashierEmail?: string;
  cashierId?: string;
}

interface HandlePrintOptions {
  customerInfo?: {
    customerName?: string;
    customerPhone?: string;
    cashierName?: string;
    cashierEmail?: string;
  };
}

export const useSales = (options?: UseSalesOptions) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const { toast } = useToast();

  const addItem = (product: Product, quantity: number = 1) => {
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    const existingItem = items.find(item => item.id === product.id);
    const itemDiscount = product.discount || 0;
    
    if (existingItem) {
      setItems(items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price * (1 - (item.discount || 0) / 100) }
          : item
      ));
    } else {
      setItems([...items, {
        id: product.id,
        name: product.name,
        quantity,
        price: product.price,
        discount: itemDiscount,
        total: product.price * quantity * (1 - itemDiscount / 100)
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    setItems(items.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price * (1 - (item.discount || 0) / 100) }
        : item
    ));
  };

  const updateItemDiscount = (id: string, discount: number) => {
    if (discount < 0 || discount > 100) {
      toast({
        title: "Error",
        description: "Discount must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    setItems(items.map(item =>
      item.id === id
        ? { ...item, discount, total: item.quantity * item.price * (1 - discount / 100) }
        : item
    ));
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

  const handlePrint = async (options?: HandlePrintOptions) => {
    try {
      await printReceipt({
        items,
        discount,
        cashierName: options?.customerInfo?.cashierName || options?.customerInfo?.cashierName,
        cashierEmail: options?.customerInfo?.cashierEmail,
        customerName: options?.customerInfo?.customerName,
        customerPhone: options?.customerInfo?.customerPhone,
      });
      
      toast({
        title: "Success",
        description: "Receipt sent to printer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to print receipt",
        variant: "destructive",
      });
    }
  };

  const clearItems = () => {
    setItems([]);
    setDiscount(0);
  };

  return {
    items,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setOverallDiscount,
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTotal,
    handlePrint,
    clearItems
  };
};
