import axios, { AxiosResponse } from 'axios';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Type-safe API client for Pokemon Champion backend
 * Provides consistent error handling and response typing
 */
export const api = {
  /**
   * Generic GET request with type safety
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    
    const response: AxiosResponse<ApiResponse<T>> = await axios.get(
      `${API_URL}${endpoint}${queryString}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data.data;
  },

  /**
   * Generic POST request with type safety
   */
  async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await axios.post(
      `${API_URL}${endpoint}`,
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data.data;
  },

  /**
   * Generic PUT request with type safety
   */
  async put<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await axios.put(
      `${API_URL}${endpoint}`,
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data.data;
  },

  /**
   * Generic DELETE request with type safety
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await axios.delete(
      `${API_URL}${endpoint}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data.data;
  },
};
