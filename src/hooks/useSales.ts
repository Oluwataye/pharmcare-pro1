
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem, Product, Sale } from '@/types/sales';
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
    businessName?: string;
    businessAddress?: string;
    cashierName?: string;
    cashierEmail?: string;
  };
}

interface CompleteSaleOptions {
  customerName?: string;
  customerPhone?: string;
  businessName?: string;
  businessAddress?: string;
  saleType: 'retail' | 'wholesale';
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

  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>(() => {
    const savedType = localStorage.getItem('CURRENT_SALE_TYPE');
    return (savedType === 'wholesale') ? 'wholesale' : 'retail';
  });
  
  const { toast } = useToast();
  const { isOnline } = useOffline();
  const { createOfflineItem } = useOfflineData();

  // Save the current sale to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('CURRENT_SALE_ITEMS', JSON.stringify(items));
    localStorage.setItem('CURRENT_SALE_DISCOUNT', discount.toString());
    localStorage.setItem('CURRENT_SALE_TYPE', saleType);
  }, [items, discount, saleType]);

  const addItem = (product: Product, quantity: number = 1, isWholesale: boolean = false) => {
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Check if wholesale conditions are met
    let useWholesalePrice = isWholesale && product.wholesalePrice !== undefined;
    
    // Auto-switch to wholesale price if quantity meets minimum threshold
    if (product.minWholesaleQuantity && quantity >= product.minWholesaleQuantity && product.wholesalePrice) {
      useWholesalePrice = true;
    }

    const price = useWholesalePrice ? product.wholesalePrice! : product.price;
    const existingItem = items.find(item => 
      item.id === product.id && item.isWholesale === useWholesalePrice
    );
    
    const itemDiscount = product.discount || 0;
    
    let newItems;
    if (existingItem) {
      newItems = items.map(item =>
        (item.id === product.id && item.isWholesale === useWholesalePrice)
          ? { 
              ...item, 
              quantity: item.quantity + quantity, 
              total: (item.quantity + quantity) * price * (1 - (item.discount || 0) / 100) 
            }
          : item
      );
    } else {
      newItems = [...items, {
        id: product.id,
        name: product.name,
        quantity,
        price,
        unitPrice: product.price,
        isWholesale: useWholesalePrice,
        discount: itemDiscount,
        total: price * quantity * (1 - itemDiscount / 100)
      }];
    }
    
    setItems(newItems);
    
    // If adding a wholesale item, set sale type to wholesale
    if (useWholesalePrice && saleType !== 'wholesale') {
      setSaleType('wholesale');
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

  const toggleItemPriceType = (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;

    // Get the product to access both retail and wholesale prices
    const mockProducts = [
      { id: "1", name: "Paracetamol", price: 500, wholesalePrice: 400, minWholesaleQuantity: 10, stock: 100 },
      { id: "2", name: "Amoxicillin", price: 1200, wholesalePrice: 1000, minWholesaleQuantity: 5, stock: 50 },
    ];
    
    const product = mockProducts.find(p => p.id === id);
    if (!product || !product.wholesalePrice) return;
    
    const newIsWholesale = !item.isWholesale;
    const newPrice = newIsWholesale ? product.wholesalePrice : product.price;
    
    setItems(items.map(i => 
      i.id === id
        ? { 
            ...i, 
            isWholesale: newIsWholesale, 
            price: newPrice,
            total: i.quantity * newPrice * (1 - (i.discount || 0) / 100)
          }
        : i
    ));
    
    if (newIsWholesale && saleType !== 'wholesale') {
      setSaleType('wholesale');
    }
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

  const setSaleTypeMode = (type: 'retail' | 'wholesale') => {
    setSaleType(type);
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
        businessName: options?.customerInfo?.businessName,
        businessAddress: options?.customerInfo?.businessAddress,
        saleType,
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
      const currentSaleType = options?.saleType || saleType;
      
      const saleData = {
        items: [...items],
        total: calculateTotal(),
        date: new Date().toISOString(),
        status: 'completed',
        discount,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        businessName: options?.businessName,
        businessAddress: options?.businessAddress,
        cashierName: options?.cashierName,
        cashierEmail: options?.cashierEmail,
        cashierId: options?.cashierId,
        transactionId: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
        // In online mode, would normally send to server
        // For now, just store locally
        const savedSales = localStorage.getItem('COMPLETED_SALES');
        const sales = savedSales ? JSON.parse(savedSales) : [];
        sales.push(saleData);
        localStorage.setItem('COMPLETED_SALES', JSON.stringify(sales));
        
        toast({
          title: `${currentSaleType === 'wholesale' ? 'Wholesale' : 'Retail'} Sale Completed`,
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
    setSaleType('retail');
    localStorage.removeItem('CURRENT_SALE_ITEMS');
    localStorage.removeItem('CURRENT_SALE_DISCOUNT');
    localStorage.removeItem('CURRENT_SALE_TYPE');
  };

  return {
    items,
    discount,
    saleType,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    toggleItemPriceType,
    setOverallDiscount,
    setSaleType: setSaleTypeMode,
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTotal,
    handlePrint,
    completeSale,
    clearItems,
    isOfflineMode: !isOnline
  };
};
