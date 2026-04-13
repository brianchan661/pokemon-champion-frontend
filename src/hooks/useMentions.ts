import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { pokemonBuilderService } from '@/services/pokemonBuilderService';
import { itemsService } from '@/services/itemsService';
import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export type MentionType = 'pokemon' | 'move' | 'item' | 'ability';

export interface MentionOption {
  type: MentionType;
  id: number;
  name: string;
  sprite?: string;
  meta?: string; // Additional info (e.g., type, category)
  nationalNumber?: string; // For Pokemon national dex number
  moveType?: string;
  moveCategory?: string;
}

interface UseMentionsResult {
  options: MentionOption[];
  loading: boolean;
  error: string | null;
  searchMentions: (query: string) => void;
}

interface UseMentionsOptions {
  enabled?: boolean;
}

export function useMentions(opts: UseMentionsOptions = {}): UseMentionsResult {
  const { enabled = true } = opts;
  const [allOptions, setAllOptions] = useState<MentionOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<MentionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    if (!enabled) return;

    async function loadAllData() {
      setLoading(true);
      setError(null);

      try {
        const [pokemonRes, movesRes, itemsRes, abilitiesRes] = await Promise.all([
          pokemonBuilderService.getPokemonList(),
          axios.get(`${API_BASE}/champions/moves?lang=en`),
          itemsService.getItems(),
          axios.get(`${API_BASE}/champions/abilities?lang=en`),
        ]);

        const options: MentionOption[] = [];

        // Pokemon
        if (pokemonRes.success && pokemonRes.data) {
          pokemonRes.data.forEach((p) => {
            options.push({
              type: 'pokemon',
              id: p.id,
              name: p.name,
              sprite: p.imageUrl,
              meta: p.types.join(', '),
              nationalNumber: p.nationalNumber.toString(),
            });
          });
        }

        // Moves - champions API returns flat array
        if (movesRes.data?.success && Array.isArray(movesRes.data?.data)) {
          movesRes.data.data.forEach((m: any) => {
            options.push({
              type: 'move',
              id: m.identifier, // use identifier as id for mentions
              name: m.name || m.name_en,
              meta: `${m.type} | ${m.category}`,
              moveType: m.type,
              moveCategory: m.category,
            });
          });
        }

        // Items - handle array response
        if (itemsRes.success && itemsRes.data) {
          itemsRes.data.forEach((i) => {
            options.push({
              type: 'item',
              id: i.id,
              name: i.name,
              sprite: i.spriteUrl,
              meta: i.category,
            });
          });
        }

        // Abilities - champions API returns flat array
        if (abilitiesRes.data?.success && Array.isArray(abilitiesRes.data?.data)) {
          abilitiesRes.data.data.forEach((a: any) => {
            options.push({
              type: 'ability',
              id: a.identifier,
              name: a.name || a.name_en,
              meta: 'Ability',
            });
          });
        }

        setAllOptions(options);
        setFilteredOptions(options); // Show all options initially
      } catch (err: any) {
        setError('Failed to load mention options');
        console.error('Error loading mentions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [enabled]);

  // Search/filter function
  const searchMentions = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredOptions(allOptions);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const filtered = allOptions
        .filter((option) => option.name.toLowerCase().includes(lowerQuery))
        .slice(0, 100); // Limit to 100 results

      setFilteredOptions(filtered);
    },
    [allOptions]
  );

  return {
    options: filteredOptions,
    loading,
    error,
    searchMentions,
  };
}
