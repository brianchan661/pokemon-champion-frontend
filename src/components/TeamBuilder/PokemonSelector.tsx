import { useState, useEffect, useMemo, useCallback } from 'react';
import { Pokemon } from '@brianchan661/pokemon-champion-shared';
import { pokemonBuilderService } from '@/services/pokemonBuilderService';
import { useTranslation } from 'next-i18next';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { ErrorMessage } from '@/components/UI/ErrorMessage';
import { TypeIcon } from '@/components/UI';

interface PokemonSelectorProps {
  onSelect: (pokemon: Pokemon) => void;
  selectedPokemonIds?: number[];
  className?: string;
}

/**
 * Pokemon selector with search and filters
 * Grid view with lazy-loaded images
 */
export function PokemonSelector({ onSelect, selectedPokemonIds = [], className = '' }: PokemonSelectorProps) {
  const { t, i18n } = useTranslation('common');
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'national_number' | 'stat_total'>('national_number');

  // Fetch Pokemon list
  useEffect(() => {
    async function fetchPokemon() {
      setLoading(true);
      setError(null);

      const currentLang = (i18n.language.startsWith('ja') ? 'ja' : 'en') as 'en' | 'ja';
      const result = await pokemonBuilderService.getPokemonList({
        type: typeFilter || undefined,
        sortBy,
        order: 'asc',
        lang: currentLang,
      });

      if (result.success && result.data) {
        setPokemon(result.data);
      } else {
        setError(result.error || 'Failed to load Pokemon');
      }

      setLoading(false);
    }

    fetchPokemon();
  }, [typeFilter, sortBy, i18n.language]);

  // Filter Pokemon by search query
  const filteredPokemon = useMemo(() => {
    if (!searchQuery.trim()) return pokemon;

    const query = searchQuery.toLowerCase();
    return pokemon.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.nationalNumber.toString().includes(query)
    );
  }, [pokemon, searchQuery]);

  // Handle Pokemon selection
  const handleSelect = useCallback((p: Pokemon) => {
    onSelect(p);
  }, [onSelect]);

  // Type options
  const typeOptions = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={new Error(error)} />;
  }

  return (
    <div className={`bg-white dark:bg-dark-bg-primary rounded-lg shadow-sm ${className}`}>
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('teamBuilder.searchPokemon', 'Search Pokemon...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-dark-text-primary"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-dark-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${typeFilter === ''
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-primary dark:hover:bg-dark-bg-secondary'
              }`}
          >
            {t('teamBuilder.allTypes', 'All')}
          </button>
          {typeOptions.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${typeFilter === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-primary dark:hover:bg-dark-bg-secondary'
                }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <label className="text-sm text-gray-600 dark:text-dark-text-secondary">{t('teamBuilder.sortBy', 'Sort by')}:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-dark-text-primary"
          >
            <option value="national_number">{t('teamBuilder.pokedexNumber', 'Pokedex #')}</option>
            <option value="name">{t('teamBuilder.name', 'Name')}</option>
            <option value="stat_total">{t('teamBuilder.statTotal', 'Base Stat Total')}</option>
          </select>
        </div>
      </div>

      {/* Pokemon Grid */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {filteredPokemon.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-dark-text-secondary py-8">
            {t('teamBuilder.noPokemonFound', 'No Pokemon found')}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPokemon.map((p) => {
              const isSelected = selectedPokemonIds.includes(p.id);

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  disabled={isSelected}
                  className={`relative p-3 rounded-lg border-2 transition-all ${isSelected
                    ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed dark:border-dark-border dark:bg-dark-bg-secondary'
                    : 'border-transparent hover:border-primary-500 hover:shadow-md dark:hover:bg-dark-bg-tertiary'
                    }`}
                >
                  {/* Pokemon Image */}
                  <div className="aspect-square mb-2 flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-dark-bg-tertiary rounded flex items-center justify-center text-gray-400 dark:text-dark-text-tertiary">
                        ?
                      </div>
                    )}
                  </div>

                  {/* Pokemon Info */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">#{p.nationalNumber}</p>
                    <p className="font-medium text-sm text-gray-900 dark:text-dark-text-primary">{p.name}</p>

                    {/* Types */}
                    <div className="flex gap-1 justify-center mt-1">
                      {p.types.map((type) => (
                        <TypeIcon key={type} type={type} size="xs" />
                      ))}
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
