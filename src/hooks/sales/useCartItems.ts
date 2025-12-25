import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SaleItem, Product } from '@/types/sales';
import { secureStorage } from '@/lib/secureStorage';

const CART_STORAGE_KEY = 'CURRENT_SALE_ITEMS';

export const useCartItems = () => {
  const [items, setItems] = useState<SaleItem[]>(() => {
    // Try to restore any in-progress sale from secure session storage
    const savedSale = secureStorage.getItem(CART_STORAGE_KEY);
    return savedSale || [];
  });

  const { toast } = useToast();

  // Save the current sale to secure storage whenever it changes
  useEffect(() => {
    secureStorage.setItem(CART_STORAGE_KEY, items);
  }, [items]);

  const addItem = (product: Product, quantity: number = 1, isWholesale: boolean = false) => {
    console.log('useCartItems: addItem called', { product, quantity, isWholesale });

    if (quantity <= 0) {
      console.log('useCartItems: Invalid quantity', quantity);
      toast({
        title: "Error",
        description: "Quantity must be greater than zero",
        variant: "destructive",
      });
      return { success: false, usedWholesalePrice: false };
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
    console.log('useCartItems: Item added successfuly', { product: product.name, quantity, isWholesale: useWholesalePrice });
    return { success: true, usedWholesalePrice: useWholesalePrice };
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

    // Toggle between retail and wholesale price
    const newIsWholesale = !item.isWholesale;
    const newPrice = newIsWholesale
      ? (item.unitPrice * 0.85) // 15% discount for wholesale
      : item.unitPrice;

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

