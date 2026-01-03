import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService, User, RegisterData, LoginData } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; data?: any }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const response = await authService.getProfile();
          if (response.success && response.data) {
            setUser(response.data.user);
          } else {
            // Invalid token, clear it
            authService.logout();
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string; data?: any }> => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        // Only set user if token is present (auto-login)
        if (response.data.token) {
          setUser(response.data.user);
        }
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const queryClient = useQueryClient();

  const logout = () => {
    authService.logout();
    setUser(null);
    queryClient.removeQueries();
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.updateProfile(updates);

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Profile update failed' };
    }
  };

  const refreshProfile = async () => {
    if (authService.isAuthenticated()) {
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    }
  };

  const resendVerification = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.resendVerification(email);
      return { success: response.success, error: response.error };
    } catch (error) {
      return { success: false, error: 'Failed to resend verification email' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    resendVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};