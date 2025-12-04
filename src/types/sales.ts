
export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  discount?: number; // Optional discount per item
  unitPrice?: number; // For tracking original price vs wholesale price
  isWholesale?: boolean; // Flag to indicate if this item is sold at wholesale price
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  customerName?: string;
  customerPhone?: string;
  discount?: number; // Overall sale discount
  cashierName?: string; // Added cashier name
  cashierEmail?: string; // Added cashier email
  cashierId?: string; // Added cashier ID for database references
  transactionId?: string; // Unique transaction identifier
  businessName?: string; // For wholesale customers
  businessAddress?: string; // For wholesale customers
  saleType: 'retail' | 'wholesale'; // Added sale type field
}

export interface Product {
  id: string;
  name: string;
  price: number;
  wholesalePrice?: number; // Added wholesale price
  minWholesaleQuantity?: number; // Minimum quantity for wholesale
  stock: number;
  discount?: number; // Potential product discount
}

export interface DiscountConfig {
  defaultDiscount: number;
  maxDiscount: number;
  enabled: boolean;
  bulkDiscountEnabled?: boolean;
  loyaltyDiscountEnabled?: boolean;
  wholesaleDiscountEnabled?: boolean; // Added wholesale discount option
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  email: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  timestamp: Date;
}

export interface WholesaleCustomer {
  id: string;
  businessName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  creditLimit?: number;
  balance?: number;
  lastOrderDate?: string;
}
