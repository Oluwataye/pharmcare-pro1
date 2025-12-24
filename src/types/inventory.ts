
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  reorderLevel: number;
  expiryDate?: string;
  manufacturer?: string;
  batchNumber?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}
