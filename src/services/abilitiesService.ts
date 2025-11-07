import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Ability {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  isHidden?: boolean;
}

interface AbilitiesFilters {
  search?: string;
  lang?: 'en' | 'ja' | 'zh-CN' | 'zh-TW';
}

class AbilitiesService {
  /**
   * Get all abilities with optional filters
   */
  async getAbilities(filters: AbilitiesFilters = {}): Promise<ApiResponse<Ability[]>> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.lang) params.append('lang', filters.lang);

      const response = await axios.get<ApiResponse<Ability[]>>(
        `${API_BASE}/abilities?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch abilities'
      };
    }
  }

  /**
   * Get single ability by ID
   */
  async getAbilityById(
    id: number,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<Ability>> {
    try {
      const response = await axios.get<ApiResponse<Ability>>(
        `${API_BASE}/abilities/${id}?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch ability'
      };
    }
  }
}

export const abilitiesService = new AbilitiesService();
