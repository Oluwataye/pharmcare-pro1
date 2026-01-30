export interface UnitConfig {
  unit: string;
  conversion: number; // How many base units in this unit (e.g. Card has 10 Tablets)
  price: number;
  is_base: boolean;
}

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
  multi_unit_config?: UnitConfig[];
}
