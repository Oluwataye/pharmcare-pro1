
import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  role: z.enum(['ADMIN', 'PHARMACIST', 'CASHIER'])
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name is too long'),
  price: z.number().min(0.01, 'Price must be greater than 0').max(999999, 'Price is too high'),
  wholesalePrice: z.number().min(0.01, 'Wholesale price must be greater than 0').max(999999, 'Wholesale price is too high'),
  stock: z.number().int().min(0, 'Stock cannot be negative').max(999999, 'Stock value is too high')
});

// Sale validation schemas
export const saleItemSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(9999, 'Quantity is too high'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  total: z.number().min(0.01, 'Total must be greater than 0'),
  isWholesale: z.boolean().optional()
});

export const customerInfoSchema = z.object({
  customerName: z.string().max(100, 'Customer name is too long').optional(),
  customerPhone: z.string().regex(/^[\+]?[0-9\-\s\(\)]*$/, 'Invalid phone number format').max(20, 'Phone number is too long').optional(),
  businessName: z.string().max(200, 'Business name is too long').optional(),
  businessAddress: z.string().max(500, 'Business address is too long').optional()
});

// Inventory validation schemas
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name is too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU is too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit is too long'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(200, 'Manufacturer name is too long'),
  batchNumber: z.string().min(1, 'Batch number is required').max(100, 'Batch number is too long')
});

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
};

// Validation utility functions
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    // Sanitize string inputs if data is an object
    if (typeof data === 'object' && data !== null) {
      const sanitizedData = { ...data } as any;
      Object.keys(sanitizedData).forEach(key => {
        if (typeof sanitizedData[key] === 'string') {
          sanitizedData[key] = sanitizeInput(sanitizedData[key]);
        }
      });
      data = sanitizedData;
    }
    
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Validation failed' };
  }
};
