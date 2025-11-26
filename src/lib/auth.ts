// Auth context and session management utilities
// For now, using localStorage. Consider NextAuth.js for production

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  bio: string | null;
  profileImage: string | null;
  course: string | null;
  batch: number | null;
  profession: string | null;
}

export const setCurrentUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearCurrentUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};
