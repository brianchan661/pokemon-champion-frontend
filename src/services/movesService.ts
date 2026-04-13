import axios from 'axios';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

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

// Map champions API move shape to the Move interface used by the team builder.
// The champions API does not use numeric IDs; we use a stable hash of the identifier
// as a surrogate numeric id so existing components that key on move.id still work.
function identifierToId(identifier: string): number {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash * 31 + identifier.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function mapChampionsMove(m: any): Move {
  return {
    id: identifierToId(m.identifier),
    identifier: m.identifier,
    name: m.name || m.name_en,
    type: m.type,
    category: m.category as Move['category'],
    power: m.power ?? undefined,
    accuracy: m.accuracy ?? undefined,
    pp: m.pp ?? 0,
    priority: m.speed_priority ?? undefined,
    description: m.effect_battle || undefined,
  };
}

class MovesService {
  private moveCache: Map<number, Move> = new Map();

  /**
   * Get all moves with optional filters.
   * Returns a paginated-shaped response for backwards compatibility with MoveSelector.
   */
  async getMoves(filters: MovesFilters = {}): Promise<ApiResponse<PaginatedMovesResponse>> {
    try {
      const params = new URLSearchParams();
      if (filters.lang) params.append('lang', filters.lang);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE}/champions/moves?${params.toString()}`);
      const raw: any[] = response.data?.data ?? [];
      const moves = raw.map(mapChampionsMove);

      // Populate cache
      moves.forEach(m => this.moveCache.set(m.id, m));

      return {
        success: true,
        data: {
          moves,
          total: moves.length,
          page: 1,
          pageSize: moves.length,
          totalPages: 1,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch moves',
      };
    }
  }

  /**
   * Get single move by surrogate numeric id (populated after getMoves is called).
   * Falls back to fetching all moves if cache is empty.
   */
  async getMoveById(
    id: number,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<Move>> {
    // Try cache first
    if (this.moveCache.has(id)) {
      return { success: true, data: this.moveCache.get(id)! };
    }

    // Populate cache then retry
    await this.getMoves({ lang });
    if (this.moveCache.has(id)) {
      return { success: true, data: this.moveCache.get(id)! };
    }

    return { success: false, error: 'Move not found' };
  }
}

export const movesService = new MovesService();
