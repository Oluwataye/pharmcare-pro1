
import { z } from 'zod';

// Enhanced password validation - matching exact requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/,
    'Password must contain: uppercase letter (A-Z), lowercase letter (a-z), number (0-9), and special character (!@#$%^&*)')
  .refine(val => !/(.)\1{3,}/.test(val), 'Password cannot contain 4 or more repeated characters');

// User validation schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(100, 'Email is too long')
    .transform(val => val.toLowerCase().trim()),
  password: passwordSchema
});

export const userSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email is too long')
    .transform(val => val.toLowerCase().trim()),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  role: z.enum(['SUPER_ADMIN', 'PHARMACIST', 'CASHIER'])
});

// Product validation schemas with enhanced security
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name is too long')
    .regex(/^[a-zA-Z0-9\s\-._()]+$/, 'Product name contains invalid characters'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .max(999999, 'Price is too high')
    .finite('Price must be a valid number'),
  wholesalePrice: z.number()
    .min(0.01, 'Wholesale price must be greater than 0')
    .max(999999, 'Wholesale price is too high')
    .finite('Wholesale price must be a valid number'),
  stock: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999999, 'Stock value is too high')
});

// Sale validation schemas
export const saleItemSchema = z.object({
  id: z.string().min(1, 'Product ID is required').max(50, 'Product ID is too long'),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name is too long'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity is too high'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .finite('Price must be a valid number'),
  total: z.number()
    .min(0.01, 'Total must be greater than 0')
    .finite('Total must be a valid number'),
  isWholesale: z.boolean().optional()
});

// Enhanced customer info validation
export const customerInfoSchema = z.object({
  customerName: z.string()
    .max(100, 'Customer name is too long')
    // Allow letters, numbers, spaces, and common punctuation
    .regex(/^[a-zA-Z0-9\s'.,()-]*$/, 'Customer name contains invalid characters')
    .optional()
    .or(z.literal('')),
  customerPhone: z.string()
    .regex(/^[\+]?[0-9\-\s\(\)]*$/, 'Invalid phone number format')
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  businessName: z.string()
    .max(200, 'Business name is too long')
    .regex(/^[a-zA-Z0-9\s\-._(),&]*$/, 'Business name contains invalid characters')
    .optional()
    .or(z.literal('')),
  businessAddress: z.string()
    .max(500, 'Business address is too long')
    .regex(/^[a-zA-Z0-9\s\-._(),#&]*$/, 'Business address contains invalid characters')
    .optional()
    .or(z.literal(''))
});

// Inventory validation schemas with enhanced security
export const inventoryItemSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name is too long')
    .regex(/^[a-zA-Z0-9\s\-._()]+$/, 'Product name contains invalid characters'),
  sku: z.string()
    .min(1, 'SKU is required')
    .max(50, 'SKU is too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Category contains invalid characters'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(999999, 'Quantity is too high'),
  unit: z.string()
    .min(1, 'Unit is required')
    .max(20, 'Unit is too long')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Unit contains invalid characters'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .max(999999, 'Price is too high')
    .finite('Price must be a valid number'),
  reorderLevel: z.number()
    .int('Reorder level must be a whole number')
    .min(0, 'Reorder level cannot be negative')
    .max(99999, 'Reorder level is too high'),
  expiryDate: z.string()
    .min(1, 'Expiry date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  manufacturer: z.string()
    .min(1, 'Manufacturer is required')
    .max(200, 'Manufacturer name is too long')
    .regex(/^[a-zA-Z0-9\s\-._(),&]+$/, 'Manufacturer name contains invalid characters'),
  batchNumber: z.string()
    .min(1, 'Batch number is required')
    .max(100, 'Batch number is too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Batch number can only contain letters, numbers, hyphens, and underscores')
});

// Enhanced input sanitization utility
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
    })
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/expression\s*\(/gi, '');
};

// XSS prevention utility
export const preventXSS = (input: string): string => {
  return sanitizeInput(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
};

// SQL injection prevention (for when backend is implemented)
export const preventSQLInjection = (input: string): string => {
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '')
    .replace(/exec/gi, '')
    .replace(/execute/gi, '')
    .replace(/union/gi, '')
    .replace(/select/gi, '')
    .replace(/insert/gi, '')
    .replace(/update/gi, '')
    .replace(/delete/gi, '')
    .replace(/drop/gi, '')
    .replace(/create/gi, '')
    .replace(/alter/gi, '');
};

// Enhanced validation utility functions
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    // Deep sanitize string inputs if data is an object
    if (typeof data === 'object' && data !== null) {
      const sanitizedData = { ...data } as any;

      const sanitizeRecursive = (obj: any): any => {
        if (typeof obj === 'string') {
          return preventXSS(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(sanitizeRecursive);
        } else if (typeof obj === 'object' && obj !== null) {
          const sanitizedObj: any = {};
          Object.keys(obj).forEach(key => {
            sanitizedObj[key] = sanitizeRecursive(obj[key]);
          });
          return sanitizedObj;
        }
        return obj;
      };

      data = sanitizeRecursive(sanitizedData);
    } else if (typeof data === 'string') {
      data = preventXSS(data);
    }

    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        // Don't expose full validation details in production for security
        ...(process.env.NODE_ENV === 'development' && { details: error.errors })
      };
    }
    return { success: false, error: 'Validation failed' };
  }
};

// Rate limiting helper (client-side basic implementation)
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, number[]>();

  return (identifier: string): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    validAttempts.push(now);
    attempts.set(identifier, validAttempts);
    return true; // Allow the request
  };
};
