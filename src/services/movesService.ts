import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Move {
  id: number;
  identifier: string;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power?: number;
  accuracy?: number;
  pp: number;
  priority?: number;
  description?: string;
}

interface MovesFilters {
  search?: string;
  type?: string;
  category?: 'physical' | 'special' | 'status';
  lang?: 'en' | 'ja' | 'zh-CN' | 'zh-TW';
  page?: number;
  pageSize?: number;
}

export interface PaginatedMovesResponse {
  moves: Move[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class MovesService {
  /**
   * Get all moves with optional filters (paginated)
   */
  async getMoves(filters: MovesFilters = {}): Promise<ApiResponse<PaginatedMovesResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.lang) params.append('lang', filters.lang);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

      const response = await axios.get<ApiResponse<PaginatedMovesResponse>>(
        `${API_BASE}/moves?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch moves'
      };
    }
  }

  /**
   * Get single move by ID
   */
  async getMoveById(
    id: number,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<Move>> {
    try {
      const response = await axios.get<ApiResponse<Move>>(
        `${API_BASE}/moves/${id}?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch move'
      };
    }
  }
}

export const movesService = new MovesService();
