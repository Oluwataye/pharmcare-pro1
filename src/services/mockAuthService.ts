import { User, UserRole } from "@/lib/types";

export const getMockUser = (email: string): User => {
  if (email.includes('admin')) {
    return {
      id: '1',
      email,
      name: 'Admin User',
      role: 'ADMIN',
      lastLogin: new Date().toISOString(),
    };
  } else if (email.includes('pharmacist')) {
    return {
      id: '2',
      email,
      name: 'Pharmacist User',
      role: 'PHARMACIST',
      lastLogin: new Date().toISOString(),
    };
  } else if (email.includes('cashier')) {
    return {
      id: '3',
      email,
      name: 'Cashier User',
      role: 'CASHIER',
      lastLogin: new Date().toISOString(),
    };
  }
  throw new Error('Invalid credentials');
};

export const validateUserRole = (user: User | null, allowedRoles: UserRole[]): boolean => {
  return user ? allowedRoles.includes(user.role) : false;
};