import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface Item {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  spriteUrl?: string;
  category: string;
}

interface ItemsFilters {
  search?: string;
  category?: string;
  lang?: 'en' | 'ja' | 'zh-CN' | 'zh-TW';
}

class ItemsService {
  /**
   * Get all items with optional filters
   */
  async getItems(filters: ItemsFilters = {}): Promise<ApiResponse<Item[]>> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.lang) params.append('lang', filters.lang);

      const response = await axios.get<ApiResponse<Item[]>>(
        `${API_BASE}/items?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch items'
      };
    }
  }

  /**
   * Get single item by ID
   */
  async getItemById(
    id: number,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<Item>> {
    try {
      const response = await axios.get<ApiResponse<Item>>(
        `${API_BASE}/items/${id}?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch item'
      };
    }
  }
}

export const itemsService = new ItemsService();
