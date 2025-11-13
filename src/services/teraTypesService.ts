import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface TeraType {
  id: number;
  typeName: string;
  iconUrl?: string;
}

class TeraTypesService {
  /**
   * Get all Tera Types
   */
  async getTeraTypes(): Promise<ApiResponse<TeraType[]>> {
    try {
      const response = await axios.get<ApiResponse<TeraType[]>>(
        `${API_BASE}/tera-types`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Tera Types'
      };
    }
  }

  /**
   * Get single Tera Type by ID
   */
  async getTeraTypeById(id: number): Promise<ApiResponse<TeraType>> {
    try {
      const response = await axios.get<ApiResponse<TeraType>>(
        `${API_BASE}/tera-types/${id}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Tera Type'
      };
    }
  }
}

export const teraTypesService = new TeraTypesService();
