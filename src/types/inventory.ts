
export interface InventoryBatch {
  id: string;
  inventory_id?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice?: number;
  created_at?: string;
}

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
  expiryDate?: string; // Earliest expiry date
  manufacturer?: string;
  batchNumber?: string; // Earliest batch number
  batches?: InventoryBatch[]; // Full breakdown
  supplierId?: string;
  restockInvoiceNumber?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}
