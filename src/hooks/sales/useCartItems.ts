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

  // Save the current sale to secure storage whenever it changes (REMOVED: Caused race conditions)
  // useEffect(() => {
  //   secureStorage.setItem(CART_STORAGE_KEY, items);
  // }, [items]);

  const addItem = (product: Product, quantity: number = 1, isWholesale: boolean = false, customUnit?: string) => {
    console.log('useCartItems: addItem called', { product, quantity, isWholesale, customUnit });

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

    // Handle Multi-Unit logic
    let price = useWholesalePrice ? product.wholesalePrice! : product.price;
    let unitLabel = product.unit || "unit";
    let baseQtyChange = quantity;

    if (customUnit && customUnit !== product.unit) {
      const unitCfg = (product as any).multi_unit_config?.find((u: any) => u.unit === customUnit);
      if (unitCfg) {
        price = unitCfg.price;
        unitLabel = customUnit;
        baseQtyChange = quantity * unitCfg.conversion;
      }
    }

    const existingItem = items.find(item =>
      item.id === product.id && item.isWholesale === useWholesalePrice && item.name.includes(`(${unitLabel})`)
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
        name: `${product.name} (${unitLabel})`,
        quantity,
        price,
        unitPrice: product.price,
        isWholesale: useWholesalePrice,
        discount: itemDiscount,
        costPrice: product.costPrice,
        total: price * quantity * (1 - itemDiscount / 100),
        unit: unitLabel,
        baseQuantity: baseQtyChange
      } as any];
    }

    setItems(newItems);
    secureStorage.setItem(CART_STORAGE_KEY, newItems); // Explicit Sync
    console.log('useCartItems: Item added successfuly', { product: product.name, quantity, isWholesale: useWholesalePrice });
    return { success: true, usedWholesalePrice: useWholesalePrice };
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    secureStorage.setItem(CART_STORAGE_KEY, newItems); // Explicit Sync
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

    const newItems = items.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price * (1 - (item.discount || 0) / 100) }
        : item
    );
    setItems(newItems);
    secureStorage.setItem(CART_STORAGE_KEY, newItems); // Explicit Sync
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

    const newItems = items.map(item =>
      item.id === id
        ? { ...item, discount, total: item.quantity * item.price * (1 - discount / 100) }
        : item
    );
    setItems(newItems);
    secureStorage.setItem(CART_STORAGE_KEY, newItems); // Explicit Sync
  };

  const toggleItemPriceType = (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;

    // Toggle between retail and wholesale price
    const newIsWholesale = !item.isWholesale;
    const newPrice = newIsWholesale
      ? (item.unitPrice * 0.85) // 15% discount for wholesale
      : item.unitPrice;

    const newItems = items.map(i =>
      i.id === id
        ? {
          ...i,
          isWholesale: newIsWholesale,
          price: newPrice,
          total: i.quantity * newPrice * (1 - (i.discount || 0) / 100)
        }
        : i
    );

    setItems(newItems);
    secureStorage.setItem(CART_STORAGE_KEY, newItems); // Explicit Sync
    return newIsWholesale;
  };

  const clearItems = () => {
    console.log('useCartItems: clearing items');
    setItems([]);
    secureStorage.removeItem(CART_STORAGE_KEY); // Explicit Removal
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

