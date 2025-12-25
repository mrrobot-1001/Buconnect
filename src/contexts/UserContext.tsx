"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  bio?: string | null;
  profileImage?: string | null;
  profile_image?: string | null;
  course?: string | null;
  batch?: number | null;
  profession?: string | null;
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
}

interface UserContextType {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  updateUserProfile: (updates: Partial<UserData>) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom event for profile updates across components
const PROFILE_UPDATE_EVENT = 'user-profile-update';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const initUser = () => {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserState(user);
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          try {
            setCurrentUserState(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Error parsing user from storage event:', error);
          }
        } else {
          setCurrentUserState(null);
        }
      }
    };

    // Listen for custom profile update events (same tab)
    const handleProfileUpdate = (e: CustomEvent<UserData>) => {
      setCurrentUserState(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PROFILE_UPDATE_EVENT, handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PROFILE_UPDATE_EVENT, handleProfileUpdate as EventListener);
    };
  }, []);

  // Set user and sync to localStorage
  const setCurrentUser = useCallback((user: UserData | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      // Dispatch custom event to update other components in the same tab
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT, { detail: user }));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, []);

  // Update specific fields of the user profile
  const updateUserProfile = useCallback((updates: Partial<UserData>) => {
    setCurrentUserState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      // Dispatch custom event to update other components in the same tab
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT, { detail: updated }));
      return updated;
    });
  }, []);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const userData = await res.json();
        const updatedUser = {
          ...currentUser,
          ...userData,
          profileImage: userData.profile_image || userData.profileImage,
          profile_image: userData.profile_image || userData.profileImage,
        };
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [currentUser, setCurrentUser]);

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      updateUserProfile, 
      refreshUser,
      isLoading 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Helper hook for components that just need to read user data
export function useCurrentUser() {
  const { currentUser, isLoading } = useUser();
  return { currentUser, isLoading };
}

// Dispatch profile update event (for use outside React components)
export function dispatchProfileUpdate(user: UserData) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT, { detail: user }));
}
