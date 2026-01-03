import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: string;
  preferred_language: string;
  is_premium: boolean;
  created_at?: string;
}

export interface LinkedAccount {
  provider: string;
  provider_email?: string;
  linked_at: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: {
    user: User;
    linked_accounts: LinkedAccount[];
  };
  error?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  preferredLanguage?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  private getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, data);

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, data);

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }

  async getProfile(): Promise<ProfileResponse> {
    try {
      // Add timestamp to prevent browser caching
      const response = await axios.get(`${API_BASE}/auth/profile?_t=${Date.now()}`, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logout(); // Clear invalid token
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get profile'
      };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await axios.put(`${API_BASE}/auth/profile`, updates, {
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile'
      };
    }
  }

  async checkHealth(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: 'Backend connection failed'
      };
    }
  }

  async resendVerification(email: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE}/auth/resend-verification`, { email });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resend verification email'
      };
    }
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = new AuthService();