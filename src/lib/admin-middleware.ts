import { getCurrentUser } from '@/lib/auth/server';

export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
};

export const requireAdmin = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
};