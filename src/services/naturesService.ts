import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
