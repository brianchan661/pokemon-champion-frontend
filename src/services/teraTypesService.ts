import axios from 'axios';
import { ApiResponse } from 'pokemon-champion-shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
