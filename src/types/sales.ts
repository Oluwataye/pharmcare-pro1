
export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  discount?: number; // Optional discount per item
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  date: string;
  status: 'completed' | 'pending';
  customerName?: string;
  customerPhone?: string;
  discount?: number; // Overall sale discount
  cashierName?: string; // Added cashier name
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  discount?: number; // Potential product discount
}

export interface DiscountConfig {
  defaultDiscount: number;
  maxDiscount: number;
  enabled: boolean;
}
