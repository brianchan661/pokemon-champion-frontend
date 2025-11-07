import { useState, useEffect, useCallback } from 'react';
import { pokemonBuilderService } from '@/services/pokemonBuilderService';
import { movesService } from '@/services/movesService';
import { itemsService } from '@/services/itemsService';
import { abilitiesService } from '@/services/abilitiesService';

export type MentionType = 'pokemon' | 'move' | 'item' | 'ability';

export interface MentionOption {
  type: MentionType;
  id: number;
  name: string;
  sprite?: string;
  meta?: string; // Additional info (e.g., type, category)
  nationalNumber?: string; // For Pokemon national dex number
}

interface UseMentionsResult {
  options: MentionOption[];
  loading: boolean;
  error: string | null;
  searchMentions: (query: string) => void;
}

export function useMentions(): UseMentionsResult {
  const [allOptions, setAllOptions] = useState<MentionOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<MentionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      setError(null);

      try {
        const [pokemonRes, movesRes, itemsRes, abilitiesRes] = await Promise.all([
          pokemonBuilderService.getPokemonList(),
          movesService.getMoves({ pageSize: 1000 }),
          itemsService.getItems(),
          abilitiesService.getAbilities(),
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
              nationalNumber: p.nationalNumber,
            });
          });
        }

        // Moves - handle paginated response
        if (movesRes.success && movesRes.data && movesRes.data.moves) {
          movesRes.data.moves.forEach((m) => {
            options.push({
              type: 'move',
              id: m.id,
              name: m.name,
              meta: `${m.type} | ${m.category}`,
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

        // Abilities
        if (abilitiesRes.success && abilitiesRes.data) {
          abilitiesRes.data.forEach((a) => {
            options.push({
              type: 'ability',
              id: a.id,
              name: a.name,
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
  }, []);

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
