import { useState, useEffect } from 'react';
import { secureStorage } from '@/lib/secureStorage';

const SALE_TYPE_STORAGE_KEY = 'CURRENT_SALE_TYPE';

export const useSaleType = () => {
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>(() => {
    const savedType = secureStorage.getItem(SALE_TYPE_STORAGE_KEY);
    return savedType === 'wholesale' ? 'wholesale' : 'retail';
  });

  // Save to secure storage whenever sale type changes
  useEffect(() => {
    secureStorage.setItem(SALE_TYPE_STORAGE_KEY, saleType);
  }, [saleType]);

  const setSaleTypeMode = (type: 'retail' | 'wholesale') => {
    setSaleType(type);
  };

  return {
    saleType,
    setSaleType: setSaleTypeMode,
    resetSaleType: () => setSaleType('retail')
  };
};

