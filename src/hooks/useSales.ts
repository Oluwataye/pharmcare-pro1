
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem, Product } from '@/types/sales';
import { printReceipt } from '@/utils/receiptPrinter';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineData } from '@/hooks/useOfflineData';

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
  const [items, setItems] = useState<SaleItem[]>(() => {
    // Try to restore any in-progress sale from localStorage
    const savedSale = localStorage.getItem('CURRENT_SALE_ITEMS');
    return savedSale ? JSON.parse(savedSale) : [];
  });
  
  const [discount, setDiscount] = useState<number>(() => {
    const savedDiscount = localStorage.getItem('CURRENT_SALE_DISCOUNT');
    return savedDiscount ? parseFloat(savedDiscount) : 0;
  });
  
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const { createOfflineItem } = useOfflineData();

  // Save the current sale to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('CURRENT_SALE_ITEMS', JSON.stringify(items));
    localStorage.setItem('CURRENT_SALE_DISCOUNT', discount.toString());
  }, [items, discount]);

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
    
    let newItems;
    if (existingItem) {
      newItems = items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price * (1 - (item.discount || 0) / 100) }
          : item
      );
    } else {
      newItems = [...items, {
        id: product.id,
        name: product.name,
        quantity,
        price: product.price,
        discount: itemDiscount,
        total: product.price * quantity * (1 - itemDiscount / 100)
      }];
    }
    
    setItems(newItems);
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

  const completeSale = async (customerInfo?: { 
    customerName?: string;
    customerPhone?: string;
  }) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Cannot complete sale with no items",
        variant: "destructive",
      });
      return false;
    }

    try {
      const saleData = {
        items: [...items],
        total: calculateTotal(),
        date: new Date().toISOString(),
        status: 'completed',
        discount,
        customerName: customerInfo?.customerName,
        customerPhone: customerInfo?.customerPhone,
        cashierName: options?.cashierName,
        cashierEmail: options?.cashierEmail,
        cashierId: options?.cashierId,
        transactionId: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };

      // If offline, save this sale for later sync
      if (!isOnline) {
        createOfflineItem('sales', saleData);
        toast({
          title: "Offline Sale Completed",
          description: "Sale has been saved offline and will sync when you're back online",
        });
      } else {
        // In online mode, would normally send to server
        // For now, just store locally
        const savedSales = localStorage.getItem('COMPLETED_SALES');
        const sales = savedSales ? JSON.parse(savedSales) : [];
        sales.push(saleData);
        localStorage.setItem('COMPLETED_SALES', JSON.stringify(sales));
        
        toast({
          title: "Sale Completed",
          description: "Sale has been successfully recorded",
        });
      }
      
      // Clear the current sale
      clearItems();
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

  const clearItems = () => {
    setItems([]);
    setDiscount(0);
    localStorage.removeItem('CURRENT_SALE_ITEMS');
    localStorage.removeItem('CURRENT_SALE_DISCOUNT');
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
    completeSale,
    clearItems,
    isOfflineMode: !isOnline
  };
};
