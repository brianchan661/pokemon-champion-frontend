import axios from 'axios';
import { ApiResponse, Pokemon } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

interface PokemonFilters {
  type?: string;
  sortBy?: 'name' | 'national_number' | 'stat_total' | 'hp_base' | 'attack_base' | 'defense_base' | 'sp_atk_base' | 'sp_def_base' | 'speed_base';
  order?: 'asc' | 'desc';
  lang?: 'en' | 'ja' | 'zh-CN' | 'zh-TW';
}

export interface ChampionsMoveEntry {
  id: number;
  identifier: string;
  nameEn: string;
  nameJa: string | null;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effectPct: string | null;
  description: string | null;
}

export interface ChampionsAbilityDetail {
  identifier: string;
  nameEn: string;
  nameJa: string | null;
  descriptionEn: string | null;
  descriptionJa: string | null;
}

export interface ChampionsPokemonDetail {
  base: Pokemon;
  forms: Pokemon[];
  moves: ChampionsMoveEntry[];
  abilities: ChampionsAbilityDetail[];
  species: string | null;
  height: string | null;
  weight: string | null;
  genderRatio: string | null;
}

class PokemonBuilderService {
  /**
   * Get lightweight Pokemon list for selector
   */
  async getPokemonList(filters: PokemonFilters = {}): Promise<ApiResponse<Pokemon[]>> {
    try {
      const params = new URLSearchParams();

      if (filters.type) params.append('type', filters.type);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.order) params.append('order', filters.order);
      if (filters.lang) params.append('lang', filters.lang);

      const response = await axios.get<ApiResponse<Pokemon[]>>(
        `${API_BASE}/champions/pokemon?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Pokemon list'
      };
    }
  }

  /**
   * Get full Pokemon details by name_lower slug (e.g. "venusaur", "mega-charizard-x")
   * Returns base stats, forms, moves, and abilities — all in one response.
   */
  async getPokemonBySlug(
    nameLower: string,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<ChampionsPokemonDetail>> {
    try {
      const response = await axios.get<ApiResponse<ChampionsPokemonDetail>>(
        `${API_BASE}/champions/pokemon/${nameLower}?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Pokemon details'
      };
    }
  }
}

export const pokemonBuilderService = new PokemonBuilderService();
