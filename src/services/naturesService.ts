import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface Nature {
  id: number;
  identifier: string;
  name: string;
  increasedStat?: 'attack' | 'defense' | 'sp_atk' | 'sp_def' | 'speed';
  decreasedStat?: 'attack' | 'defense' | 'sp_atk' | 'sp_def' | 'speed';
}

class NaturesService {
  /**
   * Get all natures
   */
  async getNatures(lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'): Promise<ApiResponse<Nature[]>> {
    try {
      const response = await axios.get<ApiResponse<Nature[]>>(
        `${API_BASE}/natures?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch natures'
      };
    }
  }

  /**
   * Get single nature by ID
   */
  async getNatureById(
    id: number,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<Nature>> {
    try {
      const response = await axios.get<ApiResponse<Nature>>(
        `${API_BASE}/natures/${id}?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch nature'
      };
    }
  }

  /**
   * Calculate stat modifier for a given nature and stat
   */
  getStatModifier(nature: Nature, stat: string): number {
    if (nature.increasedStat === stat) return 1.1;
    if (nature.decreasedStat === stat) return 0.9;
    return 1.0;
  }
}

export const naturesService = new NaturesService();
