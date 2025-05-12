
import { useState, useEffect } from 'react';

export const useSaleType = () => {
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>(() => {
    const savedType = localStorage.getItem('CURRENT_SALE_TYPE');
    return (savedType === 'wholesale') ? 'wholesale' : 'retail';
  });

  // Save to localStorage whenever sale type changes
  useEffect(() => {
    localStorage.setItem('CURRENT_SALE_TYPE', saleType);
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

