import { getCurrentUser } from './auth';

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

export const requireAdmin = (): void => {
  if (!isAdmin()) {
    throw new Error('Unauthorized: Admin access required');
  }
};
