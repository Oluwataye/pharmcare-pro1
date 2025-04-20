
export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  date: string;
  status: 'completed' | 'pending';
  customerName?: string;
  customerPhone?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}
