"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/client';

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
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, updateProfile, refreshUser } = useAuth();
  const [currentUser, setCurrentUserState] = useState<UserData | null>(null);

  // Sync with auth context
  useEffect(() => {
    if (!isLoading) {
      setCurrentUserState(user);
    }
  }, [user, isLoading]);

  const setCurrentUser = useCallback((userData: UserData | null) => {
    setCurrentUserState(userData);
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<UserData>) => {
    await updateProfile(updates);
  }, [updateProfile]);

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

export function useCurrentUser() {
  const { currentUser, isLoading } = useUser();
  return { currentUser, isLoading };
}