"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type User = {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'client' | 'freelancer' | 'manager' | 'account_owner' | 'writer' | 'editor';
  approved: boolean;
  balance: number;
  rating: number | null;
  phone: string;
  status: 'active' | 'suspended' | 'blacklisted' | 'pending' | 'rejected' | 'approved';
  suspendedUntil: string | null;
  suspensionReason: string | null;
  blacklistReason: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  totalEarned: number;
  totalSpent: number;
  completedJobs: number;
  completionRate: number | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastLoginDevice: string | null;
  loginCount: number;
  sessionExpiry?: string;
  rememberMe?: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (email: string, password: string, name: string, role: string, phone: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user once on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as User;
      
      // Quick session expiry check
      if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) < new Date()) {
        localStorage.removeItem('user');
        localStorage.removeItem('bearer_token');
        setUser(null);
      } else {
        setUser(parsed);
        // Ensure bearer token exists
        if (!localStorage.getItem('bearer_token') && parsed.id) {
          localStorage.setItem('bearer_token', String(parsed.id));
        }
      }
    } catch {
      localStorage.removeItem('user');
    }
    
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        const userWithSession = {
          ...updatedUser,
          sessionExpiry: user.sessionExpiry,
          rememberMe: user.rememberMe
        };
        
        setUser(userWithSession);
        localStorage.setItem('user', JSON.stringify(userWithSession));
        if (updatedUser.id) {
          localStorage.setItem('bearer_token', String(updatedUser.id));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [user?.id, user?.sessionExpiry, user?.rememberMe]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const userData: User = await response.json();
    setUser(userData);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('bearer_token', String(userData.id));
    
    return userData;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: string, phone: string): Promise<User> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, phone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const userData: User = await response.json();
    setUser(userData);
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('bearer_token', String(userData.id));
    
    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('bearer_token');
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    logout,
    refreshUser,
    loading
  }), [user, login, register, logout, refreshUser, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}