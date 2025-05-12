
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem, Product } from '@/types/sales';

export const useCartItems = () => {
  const [items, setItems] = useState<SaleItem[]>(() => {
    // Try to restore any in-progress sale from localStorage
    const savedSale = localStorage.getItem('CURRENT_SALE_ITEMS');
    return savedSale ? JSON.parse(savedSale) : [];
  });
  
  const { toast } = useToast();

  // Save the current sale to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('CURRENT_SALE_ITEMS', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number = 1, isWholesale: boolean = false) => {
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return false;
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
    return useWholesalePrice; // Return if wholesale pricing was used
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
    
    return newIsWholesale;
  };

  const clearItems = () => {
    setItems([]);
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    toggleItemPriceType,
    clearItems
  };
};

