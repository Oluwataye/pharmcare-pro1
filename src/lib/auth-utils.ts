import { UserRole } from "./types";

export const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/';
    case 'PHARMACIST':
      return '/inventory';
    case 'CASHIER':
      return '/sales';
    default:
      return '/';
  }
};

export const PUBLIC_ROUTES = ['/login', '/unauthorized'];

export const createUserFromSession = (session: any) => ({
  id: session.user.id,
  email: session.user.email!,
  name: session.user.user_metadata.name || 'User',
  role: (session.user.user_metadata.role as UserRole) || 'CASHIER',
});