export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  price: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  cashier_id: string | null;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  inventory_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}