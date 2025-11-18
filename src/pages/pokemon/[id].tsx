import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PokemonFull, ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon } from '@/components/UI/MoveCategoryIcon';
import { GetStaticProps, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

// Helper to convert move name to identifier format
const moveNameToIdentifier = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-');
};

export default function PokemonDetailPage() {
  const router = useRouter();
  const { id } = router.query; // This is actually the national number from the URL
  const { t } = useTranslation('common');
  const [selectedFormIndex, setSelectedFormIndex] = useState<number>(-1); // -1 means base form

  const { data: pokemon, isLoading, error } = useQuery({
    queryKey: ['pokemon', id, router.locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('lang', router.locale || 'en');

      const response = await axios.get<ApiResponse<PokemonFull>>(
        `${API_URL}/pokemon/${id}?${params.toString()}`
      );
      return response.data.data;
    },
    enabled: !!id,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.response?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('pokemon.loading')}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !pokemon) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Pokemon Not Found Error */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
                {t('pokemon.detail.notFound.title')}
              </h2>
              <p className="text-gray-600 dark:text-dark-text-secondary mb-8">
                {t('pokemon.detail.notFound.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-dark-border text-base font-medium rounded-md text-gray-700 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('error.notFound.goBack')}
                </button>
                <button
                  onClick={() => router.push('/pokemon')}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {t('pokemon.detail.notFound.browsePokemon')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-blue-600 dark:text-primary-400 hover:text-blue-800 dark:hover:text-primary-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('pokemon.detail.back')}
          </button>

          {/* Header Card with Stats */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6 mb-6">
            {/* Form Tabs (if alternative forms exist) */}
            {pokemon.details?.forms && pokemon.details.forms.length > 0 && (
              <div className="mb-6 border-b border-gray-200 dark:border-dark-border">
                <div className="flex flex-wrap gap-2 -mb-px">
                  {/* Base Form Tab */}
                  <button
                    onClick={() => setSelectedFormIndex(-1)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      selectedFormIndex === -1
                        ? 'border-blue-600 text-blue-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-dark-text-tertiary hover:text-gray-700 dark:hover:text-dark-text-primary hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {pokemon.name}
                  </button>
                  {/* Alternative Form Tabs */}
                  {pokemon.details.forms.map((form: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFormIndex(idx)}
                      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        selectedFormIndex === idx
                          ? 'border-blue-600 text-blue-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-dark-text-tertiary hover:text-gray-700 dark:hover:text-dark-text-primary hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {form.formName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <PokemonFormDisplay
              pokemon={pokemon}
              selectedFormIndex={selectedFormIndex}
              t={t}
            />
          </div>

          {/* Moves (if available) */}
          {pokemon.details?.movesByGeneration && pokemon.details.movesByGeneration.length > 0 && (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">{t('pokemon.detail.moves')}</h2>
              <MovesDisplay movesByGeneration={pokemon.details.movesByGeneration} t={t} />
            </div>
          )}

          {/* Evolution Chain */}
          {pokemon.details?.evolutionChain && (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">{t('pokemon.detail.evolutionChain')}</h2>
              <div className="overflow-x-auto">
                <EvolutionChainDisplay evolutionChain={pokemon.details.evolutionChain} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Pokemon Form Display Component
interface PokemonFormDisplayProps {
  pokemon: PokemonFull;
  selectedFormIndex: number;
  t: any;
}

function PokemonFormDisplay({ pokemon, selectedFormIndex, t }: PokemonFormDisplayProps) {
  // Determine which form to display
  const isBaseForm = selectedFormIndex === -1;
  const selectedForm = isBaseForm ? null : pokemon.details?.forms?.[selectedFormIndex];

  // Get display data based on selected form
  const displayData = {
    name: isBaseForm ? pokemon.name : selectedForm?.formName || pokemon.name,
    imageUrl: isBaseForm ? pokemon.imageUrl : selectedForm?.imageUrl || pokemon.imageUrl,
    types: isBaseForm ? pokemon.types : selectedForm?.types || pokemon.types,
    abilities: isBaseForm
      ? [pokemon.ability1, pokemon.ability2, pokemon.abilityHidden].filter(Boolean)
      : selectedForm?.abilities || [pokemon.ability1, pokemon.ability2, pokemon.abilityHidden].filter(Boolean),
    stats: isBaseForm
      ? {
          hp: { base: pokemon.details?.hpBase, max: pokemon.hpMax },
          attack: { base: pokemon.details?.attackBase, max: pokemon.attackMax },
          defense: { base: pokemon.details?.defenseBase, max: pokemon.defenseMax },
          spAtk: { base: pokemon.details?.spAtkBase, max: pokemon.spAtkMax },
          spDef: { base: pokemon.details?.spDefBase, max: pokemon.spDefMax },
          speed: { base: pokemon.details?.speedBase, max: pokemon.speedMax },
          total: pokemon.statTotal,
        }
      : {
          hp: selectedForm?.baseStats?.hp || { base: pokemon.details?.hpBase, max: pokemon.hpMax },
          attack: selectedForm?.baseStats?.attack || { base: pokemon.details?.attackBase, max: pokemon.attackMax },
          defense: selectedForm?.baseStats?.defense || { base: pokemon.details?.defenseBase, max: pokemon.defenseMax },
          spAtk: selectedForm?.baseStats?.spAtk || { base: pokemon.details?.spAtkBase, max: pokemon.spAtkMax },
          spDef: selectedForm?.baseStats?.spDef || { base: pokemon.details?.spDefBase, max: pokemon.spDefMax },
          speed: selectedForm?.baseStats?.speed || { base: pokemon.details?.speedBase, max: pokemon.speedMax },
          total: selectedForm?.baseStats?.total || pokemon.statTotal,
        },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Image and Basic Info */}
      <div>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Pokemon Image */}
          <div className="flex-shrink-0">
            {displayData.imageUrl && (
              <img
                src={displayData.imageUrl}
                alt={displayData.name}
                className="w-48 h-48 object-contain mx-auto"
              />
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="mb-4">
              <span className="text-xl text-gray-500 dark:text-dark-text-tertiary">#{pokemon.nationalNumber}</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{displayData.name}</h1>
            </div>

            {/* Types */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-600 dark:text-dark-text-secondary mr-2">{t('pokemon.type')}:</span>
              <div className="inline-flex gap-2">
                {displayData.types.map((type, idx) => (
                  <TypeIcon key={idx} type={type} size="md" />
                ))}
              </div>
            </div>

            {/* Abilities */}
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-600 dark:text-dark-text-secondary mr-2">{t('pokemon.abilities')}:</span>
              <span className="text-gray-900 dark:text-dark-text-primary">
                {displayData.abilities.map((ability, idx) => (
                  <span key={idx}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/data/abilities/${ability?.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                    >
                      {ability}
                    </Link>
                  </span>
                ))}
              </span>
            </div>

            {/* Species, Height, Weight (only for base form) */}
            {isBaseForm && pokemon.details && (
              <>
                {pokemon.details.species && (
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-600 dark:text-dark-text-secondary mr-2">{t('pokemon.detail.species')}:</span>
                    <span className="text-gray-900 dark:text-dark-text-primary">{pokemon.details.species}</span>
                  </div>
                )}
                {pokemon.details.height && (
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-600 dark:text-dark-text-secondary mr-2">{t('pokemon.detail.height')}:</span>
                    <span className="text-gray-900 dark:text-dark-text-primary">{pokemon.details.height}</span>
                  </div>
                )}
                {pokemon.details.weight && (
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-600 dark:text-dark-text-secondary mr-2">{t('pokemon.detail.weight')}:</span>
                    <span className="text-gray-900 dark:text-dark-text-primary">{pokemon.details.weight}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Base Stats */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">{t('pokemon.detail.baseStats')}</h2>
        <div className="space-y-3">
          {[
            { label: t('pokemon.stats.hp'), stat: displayData.stats.hp },
            { label: t('pokemon.stats.attack'), stat: displayData.stats.attack },
            { label: t('pokemon.stats.defense'), stat: displayData.stats.defense },
            { label: t('pokemon.stats.spAtk'), stat: displayData.stats.spAtk },
            { label: t('pokemon.stats.spDef'), stat: displayData.stats.spDef },
            { label: t('pokemon.stats.speed'), stat: displayData.stats.speed },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-20 text-sm font-semibold text-gray-600 dark:text-dark-text-secondary">{item.label}</div>
              <div className="w-12 text-right font-bold text-gray-900 dark:text-dark-text-primary">{item.stat.base}</div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(((item.stat.base || 0) / 255) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="w-14 text-xs text-gray-500 dark:text-dark-text-tertiary">Max: {item.stat.max}</div>
            </div>
          ))}
          <div className="pt-3 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm font-bold text-gray-700 dark:text-dark-text-secondary">{t('pokemon.stats.total')}</div>
              <div className="flex-1 text-right font-bold text-blue-600 dark:text-primary-400 text-xl">{displayData.stats.total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Moves Display Component
interface MovesDisplayProps {
  movesByGeneration: any[];
  t: any;
}

function MovesDisplay({ movesByGeneration, t }: MovesDisplayProps) {
  // Helper function to check if a game version has any moves
  const hasMovesData = (gameVersion: any) => {
    const moves = gameVersion.movesByMethod;
    return (
      (moves.moves && moves.moves.length > 0) ||
      (moves.tmMoves && moves.tmMoves.length > 0) ||
      (moves.eggMoves && moves.eggMoves.length > 0) ||
      (moves.evolutionMoves && moves.evolutionMoves.length > 0) ||
      (moves.hmMoves && moves.hmMoves.length > 0)
    );
  };

  // Filter generations that have at least one game version with moves
  const generationsWithMoves = movesByGeneration
    .map((gen, originalIndex) => ({
      ...gen,
      originalIndex,
      gameVersions: gen.gameVersions
        .map((gv: any, gvOriginalIndex: number) => ({
          ...gv,
          originalIndex: gvOriginalIndex
        }))
        .filter((gv: any) => hasMovesData(gv))
    }))
    .filter((gen) => gen.gameVersions.length > 0);

  // State for selected generation and game version
  const [selectedGenerationIndex, setSelectedGenerationIndex] = useState(generationsWithMoves.length - 1);
  const [selectedGameVersionIndex, setSelectedGameVersionIndex] = useState(0);
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);

  // Get the selected generation
  const selectedGeneration = generationsWithMoves[selectedGenerationIndex];

  // Update game version index when generation changes
  useEffect(() => {
    if (selectedGeneration?.gameVersions) {
      // Default to the latest game version in the selected generation
      setSelectedGameVersionIndex(selectedGeneration.gameVersions.length - 1);
      // Reset filters when generation changes
      setSelectedTypeFilters([]);
      setSelectedCategoryFilters([]);
    }
  }, [selectedGenerationIndex]);

  // Reset filters when game version changes
  useEffect(() => {
    setSelectedTypeFilters([]);
    setSelectedCategoryFilters([]);
  }, [selectedGameVersionIndex]);

  if (!generationsWithMoves || generationsWithMoves.length === 0) {
    return <p className="text-gray-500 dark:text-dark-text-secondary">{t('pokemon.detail.noMoves')}</p>;
  }

  if (!selectedGeneration || !selectedGeneration.gameVersions || selectedGeneration.gameVersions.length === 0) {
    return <p className="text-gray-500 dark:text-dark-text-secondary">{t('pokemon.detail.noMoves')}</p>;
  }

  const selectedGameVersion = selectedGeneration.gameVersions[selectedGameVersionIndex];

  if (!selectedGameVersion) {
    return <p className="text-gray-500 dark:text-dark-text-secondary">{t('pokemon.detail.noMoves')}</p>;
  }

  const movesByMethod = selectedGameVersion.movesByMethod;
  const gameVersion = selectedGameVersion.gameVersion || selectedGameVersion.version;

  // Get all unique types from current moves
  const allMoveTypes = Array.from(
    new Set([
      ...(movesByMethod.moves || []).map((m: any) => m.type),
      ...(movesByMethod.tmMoves || []).map((m: any) => m.type),
      ...(movesByMethod.hmMoves || []).map((m: any) => m.type),
      ...(movesByMethod.eggMoves || []).map((m: any) => m.type),
      ...(movesByMethod.evolutionMoves || []).map((m: any) => m.type),
    ])
  ).filter(Boolean).sort();

  // Get all unique categories from current moves
  const allMoveCategories = Array.from(
    new Set([
      ...(movesByMethod.moves || []).map((m: any) => m.category?.toLowerCase()),
      ...(movesByMethod.tmMoves || []).map((m: any) => m.category?.toLowerCase()),
      ...(movesByMethod.hmMoves || []).map((m: any) => m.category?.toLowerCase()),
      ...(movesByMethod.eggMoves || []).map((m: any) => m.category?.toLowerCase()),
      ...(movesByMethod.evolutionMoves || []).map((m: any) => m.category?.toLowerCase()),
    ])
  ).filter(Boolean).sort();

  // Filter moves by type and category (multiple with OR logic within each filter type)
  const filterMoves = (moves: any[]) => {
    if (!moves) return moves;

    let filtered = moves;

    // Apply type filter
    if (selectedTypeFilters.length > 0) {
      filtered = filtered.filter((m: any) => selectedTypeFilters.includes(m.type));
    }

    // Apply category filter
    if (selectedCategoryFilters.length > 0) {
      filtered = filtered.filter((m: any) =>
        selectedCategoryFilters.includes(m.category?.toLowerCase())
      );
    }

    return filtered;
  };

  // Toggle type filter selection
  const toggleTypeFilter = (type: string) => {
    setSelectedTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Toggle category filter selection
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategoryFilters(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredMovesByMethod = {
    moves: filterMoves(movesByMethod.moves),
    tmMoves: filterMoves(movesByMethod.tmMoves),
    hmMoves: filterMoves(movesByMethod.hmMoves),
    eggMoves: filterMoves(movesByMethod.eggMoves),
    evolutionMoves: filterMoves(movesByMethod.evolutionMoves),
  };

  return (
    <div>
      {/* Generation and Game Version Selectors */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Generation Selector */}
          <div>
            <label htmlFor="generation-select" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              {t('pokemon.detail.selectGeneration')}
            </label>
            <select
              id="generation-select"
              value={selectedGenerationIndex}
              onChange={(e) => setSelectedGenerationIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary"
            >
              {generationsWithMoves.map((gen, index) => (
                <option key={index} value={index}>
                  {gen.generation}
                </option>
              ))}
            </select>
          </div>

          {/* Game Version Selector */}
          <div>
            <label htmlFor="game-version-select" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              {t('pokemon.detail.selectGameVersion')}
            </label>
            <select
              id="game-version-select"
              value={selectedGameVersionIndex}
              onChange={(e) => setSelectedGameVersionIndex(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary"
            >
              {selectedGeneration.gameVersions.map((gv: any, index: number) => (
                <option key={index} value={index}>
                  {gv.gameVersion || gv.version}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
            {t('pokemon.detail.filterByType') || 'Filter by Type'}
            {selectedTypeFilters.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-dark-text-tertiary">
                ({selectedTypeFilters.length} selected)
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTypeFilters([])}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedTypeFilters.length === 0
                  ? 'bg-gray-800 dark:bg-gray-700 text-white'
                  : 'bg-gray-200 dark:bg-dark-bg-primary text-gray-700 dark:text-dark-text-primary hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('pokemon.detail.allTypes') || 'All Types'}
            </button>
            {allMoveTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`transition-all ${
                  selectedTypeFilters.includes(type)
                    ? 'ring-2 ring-primary-500 ring-offset-2'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <TypeIcon type={type} size="md" />
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
            {t('moves.filterByCategory') || 'Filter by Category'}
            {selectedCategoryFilters.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-dark-text-tertiary">
                ({selectedCategoryFilters.length} selected)
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategoryFilters([])}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategoryFilters.length === 0
                  ? 'bg-gray-800 dark:bg-gray-700 text-white'
                  : 'bg-gray-200 dark:bg-dark-bg-primary text-gray-700 dark:text-dark-text-primary hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('moves.all') || 'All'}
            </button>
            {allMoveCategories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategoryFilter(category)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategoryFilters.includes(category)
                    ? 'bg-primary-600 text-white ring-2 ring-primary-500 ring-offset-2'
                    : 'bg-gray-200 dark:bg-dark-bg-primary text-gray-700 dark:text-dark-text-primary hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <MoveCategoryIcon
                  category={category as 'physical' | 'special' | 'status'}
                  size={20}
                />
                <span className="capitalize">{t(`moves.categories.${category}`) || category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Level Up Moves */}
      {filteredMovesByMethod.moves && filteredMovesByMethod.moves.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-3">{t('pokemon.detail.levelUpMoves')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.level')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.move')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.type')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.category')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.power')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.accuracy')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {filteredMovesByMethod.moves.map((move: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-dark-text-primary">{move.level}</td>
                    <td className="px-4 py-2 text-sm">
                      <Link
                        href={`/data/moves/${moveNameToIdentifier(move.name)}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                      >
                        {move.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <TypeIcon type={move.type} size="sm" />
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={24} />
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-dark-text-primary">{move.power}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-dark-text-primary">{move.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TM Moves */}
      {filteredMovesByMethod.tmMoves && filteredMovesByMethod.tmMoves.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-3">{t('pokemon.detail.tmMoves')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">TM</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.move')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.type')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.category')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.power')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.accuracy')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {filteredMovesByMethod.tmMoves.map((move: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-dark-text-primary">{move.tm}</td>
                    <td className="px-4 py-2 text-sm">
                      <Link
                        href={`/data/moves/${moveNameToIdentifier(move.name)}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                      >
                        {move.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <TypeIcon type={move.type} size="sm" />
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={24} />
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-dark-text-primary">{move.power}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-dark-text-primary">{move.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Egg Moves */}
      {filteredMovesByMethod.eggMoves && filteredMovesByMethod.eggMoves.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text-primary mb-3">{t('pokemon.detail.eggMoves')}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.move')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.type')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.category')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.power')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">{t('pokemon.detail.accuracy')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {filteredMovesByMethod.eggMoves.map((move: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="px-4 py-2 text-sm">
                      <Link
                        href={`/data/moves/${moveNameToIdentifier(move.name)}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                      >
                        {move.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <TypeIcon type={move.type} size="sm" />
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={24} />
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-dark-text-primary">{move.power}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900 dark:text-dark-text-primary">{move.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Evolution Chain Component
interface EvolutionNode {
  nationalNumber: string;
  name: string;
  types: string[];
  imageUrl: string;
  evolvesTo?: Array<{
    pokemon: EvolutionNode;
    condition: string;
  }>;
}

interface EvolutionChainProps {
  evolutionChain: {
    baseForm: EvolutionNode;
  };
}

function EvolutionChainDisplay({ evolutionChain }: EvolutionChainProps) {
  const router = useRouter();

  const handlePokemonClick = (nationalNumber: string) => {
    // Extract just the number from format like "#0025"
    const cleanNumber = nationalNumber.replace('#', '');
    window.open(`/pokemon/${cleanNumber}`, '_blank');
  };

  const renderEvolutionNode = (node: EvolutionNode, depth: number = 0) => {
    return (
      <div key={`${node.nationalNumber}-${depth}`} className="flex items-center gap-4">
        {/* Pokemon Card */}
        <div
          className="flex flex-col items-center min-w-[180px] p-4 border-2 border-gray-200 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary cursor-pointer hover:border-blue-500 dark:hover:border-primary-400 hover:shadow-lg transition-all"
          onClick={() => handlePokemonClick(node.nationalNumber)}
        >
          <div className="text-sm text-gray-500 dark:text-dark-text-tertiary mb-1">#{node.nationalNumber}</div>
          {node.imageUrl && (
            <img src={node.imageUrl} alt={node.name} className="w-24 h-24 object-contain mb-2" />
          )}
          <div className="font-bold text-center mb-2 dark:text-dark-text-primary">{node.name}</div>
          <div className="flex gap-1">
            {node.types.map((type, idx) => (
              <TypeIcon key={idx} type={type} size="xs" />
            ))}
          </div>
        </div>

        {/* Evolution Arrows */}
        {node.evolvesTo && node.evolvesTo.length > 0 && (
          <div className="flex flex-col gap-4">
            {node.evolvesTo.map((evolution, idx) => (
              <div key={idx} className="flex items-center gap-4">
                {/* Arrow with condition */}
                <div className="flex flex-col items-center min-w-[120px]">
                  <svg className="w-12 h-12 text-blue-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-xs text-center text-gray-600 dark:text-dark-text-secondary mt-1 max-w-[120px]">
                    {evolution.condition}
                  </div>
                </div>

                {/* Next Pokemon */}
                {renderEvolutionNode(evolution.pokemon, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-start">
      {renderEvolutionNode(evolutionChain.baseForm)}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
