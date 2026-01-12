
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  costPrice?: number;
  profitMargin?: number;
  reorderLevel: number;
  expiryDate?: string;
  manufacturer?: string;
  batchNumber?: string;
  supplierId?: string;
  restockInvoiceNumber?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}
