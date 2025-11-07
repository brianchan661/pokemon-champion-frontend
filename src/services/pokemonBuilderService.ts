import axios from 'axios';
import { ApiResponse, Pokemon, PokemonFull } from '@brianchan661/pokemon-champion-shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PokemonFilters {
  type?: string;
  sortBy?: 'name' | 'national_number' | 'stat_total' | 'hp_max' | 'attack_max' | 'defense_max' | 'sp_atk_max' | 'sp_def_max' | 'speed_max';
  order?: 'asc' | 'desc';
  lang?: 'en' | 'ja';
}

interface PokemonAbility {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  slot: number;
  isHidden: boolean;
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
        `${API_BASE}/pokemon?${params.toString()}`
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
   * Get full Pokemon details by national number
   */
  async getPokemonByNationalNumber(
    nationalNumber: string,
    lang: 'en' | 'ja' = 'en'
  ): Promise<ApiResponse<PokemonFull>> {
    try {
      const response = await axios.get<ApiResponse<PokemonFull>>(
        `${API_BASE}/pokemon/${nationalNumber}?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Pokemon details'
      };
    }
  }

  /**
   * Get available moves for a Pokemon
   */
  async getPokemonMoves(pokemonId: number): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get<ApiResponse<any>>(
        `${API_BASE}/pokemon/${pokemonId}/moves`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Pokemon moves'
      };
    }
  }

  /**
   * Get available abilities for a Pokemon
   */
  async getPokemonAbilities(
    pokemonId: number,
    lang: 'en' | 'ja' | 'zh-CN' | 'zh-TW' = 'en'
  ): Promise<ApiResponse<PokemonAbility[]>> {
    try {
      const response = await axios.get<ApiResponse<PokemonAbility[]>>(
        `${API_BASE}/pokemon/${pokemonId}/abilities?lang=${lang}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch Pokemon abilities'
      };
    }
  }
}

export const pokemonBuilderService = new PokemonBuilderService();
