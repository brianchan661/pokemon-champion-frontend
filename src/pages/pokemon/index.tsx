import { useState, useMemo, memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Pokemon, ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon, TypeFilterGrid } from '@/components/UI';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getApiBaseUrl } from '@/config/api';
import { getTypeHex, getCardHeaderStyle } from '@/utils/typeColors';

const API_URL = getApiBaseUrl();

type ViewMode = 'table' | 'grid';

export default function PokemonListPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  const currentLocale = locale || 'en';

  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [statRanges, setStatRanges] = useState({
    hp: { min: 0, max: 999 },
    attack: { min: 0, max: 999 },
    defense: { min: 0, max: 999 },
    spAtk: { min: 0, max: 999 },
    spDef: { min: 0, max: 999 },
    speed: { min: 0, max: 999 },
  });
  // Active filter state (updated on interaction end)
  const [filterStatRanges, setFilterStatRanges] = useState(statRanges);

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'national_number' | 'stat_total' | 'hp_max' | 'attack_max' | 'defense_max' | 'sp_atk_max' | 'sp_def_max' | 'speed_max'>('national_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- Data Fetching ---
  const {
    data: allPokemon = [] as Pokemon[],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['pokemon-all', currentLocale, 'v2'],
    queryFn: async () => {
      // Fetch ALL pokemon in one request
      const params = new URLSearchParams();
      params.append('lang', currentLocale);
      // No page/pageSize parameters -> Backend returns all records
      params.append('sortBy', 'national_number');
      params.append('order', 'asc');

      const response = await axios.get<ApiResponse<Pokemon[]>>(
        `${API_URL}/pokemon?${params.toString()}`
      );
      // Handle potential API response structure differences
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Fallback if backend still returns paginated wrapper (shouldn't if params omitted, but safe check)
      // @ts-expect-error: Handling potential API response variations
      return response.data.data?.data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // --- Filtering Logic ---
  // --- filtering Logic ---
  // 1. Base Filter (Search & Types) - Used to calculate available stat ranges
  const baseFilteredPokemon = useMemo(() => {
    if (allPokemon.length === 0) return [];

    return allPokemon.filter((p: Pokemon) => {
      // 1. Search (Name/Number/Ability)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query);
        const numberMatch = p.nationalNumber.toString().includes(query);
        const abilityMatch = (
          p.ability1.toLowerCase().includes(query) ||
          (p.ability2 && p.ability2.toLowerCase().includes(query)) ||
          (p.abilityHidden && p.abilityHidden.toLowerCase().includes(query))
        );
        if (!nameMatch && !numberMatch && !abilityMatch) return false;
      }

      // 2. Types
      if (selectedTypes.length > 0) {
        const hasType = selectedTypes.some(type =>
          p.types.some(pt => pt.toLowerCase() === type.toLowerCase())
        );
        if (!hasType) return false;
      }

      return true;
    });
  }, [allPokemon, searchQuery, selectedTypes]);

  // 2. Calculate dynamic stat limits based on baseFilteredPokemon
  const statLimits = useMemo(() => {
    const limits = {
      hp: { min: 0, max: 999 },
      attack: { min: 0, max: 999 },
      defense: { min: 0, max: 999 },
      spAtk: { min: 0, max: 999 },
      spDef: { min: 0, max: 999 },
      speed: { min: 0, max: 999 },
    };

    if (baseFilteredPokemon.length === 0) return limits;

    // Helper to find min/max
    const findMinMax = (key: keyof Pokemon) => {
      let min = 999;
      let max = 0;
      baseFilteredPokemon.forEach((p: Pokemon) => {
        const val = p[key] as number;
        if (val < min) min = val;
        if (val > max) max = val;
      });
      return { min, max };
    };

    limits.hp = findMinMax('hpMax');
    limits.attack = findMinMax('attackMax');
    limits.defense = findMinMax('defenseMax');
    limits.spAtk = findMinMax('spAtkMax');
    limits.spDef = findMinMax('spDefMax');
    limits.speed = findMinMax('speedMax');

    return limits;
  }, [baseFilteredPokemon]);

  // 3. Final Filter (Stats)
  const finalFilteredPokemon = useMemo(() => {
    return baseFilteredPokemon.filter((p: Pokemon) => {
      if (p.hpMax < filterStatRanges.hp.min || p.hpMax > filterStatRanges.hp.max) return false;
      if (p.attackMax < filterStatRanges.attack.min || p.attackMax > filterStatRanges.attack.max) return false;
      if (p.defenseMax < filterStatRanges.defense.min || p.defenseMax > filterStatRanges.defense.max) return false;
      if (p.spAtkMax < filterStatRanges.spAtk.min || p.spAtkMax > filterStatRanges.spAtk.max) return false;
      if (p.spDefMax < filterStatRanges.spDef.min || p.spDefMax > filterStatRanges.spDef.max) return false;
      if (p.speedMax < filterStatRanges.speed.min || p.speedMax > filterStatRanges.speed.max) return false;
      return true;
    });
  }, [baseFilteredPokemon, filterStatRanges]);

  // --- Sorting Logic ---
  const sortedPokemon = useMemo(() => {
    return finalFilteredPokemon.slice().sort((a: Pokemon, b: Pokemon) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name': aValue = a.name; bValue = b.name; break;
        case 'national_number': aValue = a.nationalNumber; bValue = b.nationalNumber; break;
        case 'stat_total': aValue = a.statTotal; bValue = b.statTotal; break;
        case 'hp_max': aValue = a.hpMax; bValue = b.hpMax; break;
        case 'attack_max': aValue = a.attackMax; bValue = b.attackMax; break;
        case 'defense_max': aValue = a.defenseMax; bValue = b.defenseMax; break;
        case 'sp_atk_max': aValue = a.spAtkMax; bValue = b.spAtkMax; break;
        case 'sp_def_max': aValue = a.spDefMax; bValue = b.spDefMax; break;
        case 'speed_max': aValue = a.speedMax; bValue = b.speedMax; break;
        default: aValue = a.nationalNumber; bValue = b.nationalNumber;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
  }, [finalFilteredPokemon, sortBy, sortOrder]);


  // --- Helper Functions ---
  const handleSort = useCallback((column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const allTypes = useMemo(() => {
    return [
      'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
      'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
    ];
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    count += selectedTypes.length;
    Object.entries(filterStatRanges).forEach(([stat, range]) => {
      const key = stat as keyof typeof statLimits;
      if (range.min > statLimits[key].min || range.max < statLimits[key].max) count++;
    });
    return count;
  }, [searchQuery, selectedTypes, filterStatRanges, statLimits]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    const reset = { hp: { min: 0, max: 999 }, attack: { min: 0, max: 999 }, defense: { min: 0, max: 999 }, spAtk: { min: 0, max: 999 }, spDef: { min: 0, max: 999 }, speed: { min: 0, max: 999 } };
    setStatRanges(reset);
    setFilterStatRanges(reset);
  };



  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{t('pokemon.title')}</h1>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('pokemon.searchPlaceholder')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  title="Table View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                {t('pokemon.filters')}
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-600 text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-border p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
              {/* Types */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-3">{t('pokemon.filterTypes')}</h3>
                <TypeFilterGrid selectedTypes={selectedTypes} onToggle={toggleType} types={allTypes} />
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-3">{t('pokemon.filterStats')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(statRanges).map(([stat, range]) => {
                    const statKey = stat as keyof typeof statRanges;
                    const limitMin = statLimits[statKey].min;
                    const limitMax = statLimits[statKey].max;
                    const effectiveMin = Math.max(range.min, limitMin);
                    const effectiveMax = Math.min(range.max, limitMax);
                    const label = stat === 'spAtk' ? 'Sp. Atk' : stat === 'spDef' ? 'Sp. Def' : stat.charAt(0).toUpperCase() + stat.slice(1);
                    return (
                      <div key={stat} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{label}</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <input
                              type="number"
                              min={limitMin}
                              max={effectiveMax}
                              value={effectiveMin}
                              onChange={(e) => {
                                const v = Math.min(Number(e.target.value), effectiveMax);
                                setStatRanges(prev => ({ ...prev, [stat]: { ...prev[statKey], min: v } }));
                                setFilterStatRanges(prev => ({ ...prev, [stat]: { ...prev[statKey], min: v } }));
                              }}
                              className="w-12 text-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-xs dark:text-gray-200"
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min={effectiveMin}
                              max={limitMax}
                              value={effectiveMax}
                              onChange={(e) => {
                                const v = Math.max(Number(e.target.value), effectiveMin);
                                setStatRanges(prev => ({ ...prev, [stat]: { ...prev[statKey], max: v } }));
                                setFilterStatRanges(prev => ({ ...prev, [stat]: { ...prev[statKey], max: v } }));
                              }}
                              className="w-12 text-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-xs dark:text-gray-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-6 shrink-0">Min</span>
                            <input
                              type="range"
                              min={limitMin}
                              max={limitMax}
                              value={effectiveMin}
                              onChange={(e) => {
                                const v = Math.min(Number(e.target.value), effectiveMax);
                                setStatRanges(prev => ({ ...prev, [stat]: { ...prev[statKey], min: v } }));
                              }}
                              onMouseUp={() => setFilterStatRanges(statRanges)}
                              onTouchEnd={() => setFilterStatRanges(statRanges)}
                              className="flex-1 accent-blue-600 dark:accent-blue-400 h-1 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-6 shrink-0">Max</span>
                            <input
                              type="range"
                              min={limitMin}
                              max={limitMax}
                              value={effectiveMax}
                              onChange={(e) => {
                                const v = Math.max(Number(e.target.value), effectiveMin);
                                setStatRanges(prev => ({ ...prev, [stat]: { ...prev[statKey], max: v } }));
                              }}
                              onMouseUp={() => setFilterStatRanges(statRanges)}
                              onTouchEnd={() => setFilterStatRanges(statRanges)}
                              className="flex-1 accent-blue-600 dark:accent-blue-400 h-1 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {t('pokemon.loadingDatabase')}
              </span>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{t('pokemon.showingResults', { shown: sortedPokemon.length, total: allPokemon.length })}</span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t('pokemon.clearAllFilters')}
              </button>
            )}
          </div>

          {/* Main Content Area */}
          <MemoizedPokemonList
            pokemon={sortedPokemon}
            loading={isLoading}
            viewMode={viewMode}
            handleSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onNavigate={(n) => router.push(`/pokemon/${n}`)}
          />

        </div>
      </div>
    </Layout>
  );
}

// --- Sub-components for Performance ---
interface PokemonListProps {
  pokemon: Pokemon[];
  loading: boolean;
  viewMode: 'table' | 'grid';
  handleSort: (column: any) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onNavigate: (nationalNumber: number) => void;
}

const TableSortIcon = ({ column, sortBy, sortOrder }: { column: string, sortBy: string, sortOrder: 'asc' | 'desc' }) => {
  if (sortBy !== column) return <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
  return sortOrder === 'asc' ?
    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg> :
    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
};

const MemoizedPokemonList = memo(({ pokemon, loading, viewMode, handleSort, sortBy, sortOrder, onNavigate }: PokemonListProps) => {
  const { t } = useTranslation('common');
  if (pokemon.length === 0 && !loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-dark-bg-secondary rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="50" cy="50" r="44" />
          <line x1="6" y1="50" x2="94" y2="50" />
          <circle cx="50" cy="50" r="12" fill="white" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('pokemon.noResultsTitle')}</h3>
        <p className="text-gray-500 dark:text-gray-400">{t('pokemon.noResultsHint')}</p>
      </div>
    );
  }

  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
            <tr>
              <th onClick={() => handleSort('national_number')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"><div className="flex items-center gap-1">#{<TableSortIcon column="national_number" sortBy={sortBy} sortOrder={sortOrder} />}</div></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">{t('pokemon.image')}</th>
              <th onClick={() => handleSort('name')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"><div className="flex items-center gap-1">{t('pokemon.name')}{<TableSortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} />}</div></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('pokemon.type')}</th>
              <th onClick={() => handleSort('stat_total')} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"><div className="flex items-center justify-center gap-1">{t('pokemon.stats.total')}{<TableSortIcon column="stat_total" sortBy={sortBy} sortOrder={sortOrder} />}</div></th>
              <th onClick={() => handleSort('hp_max')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.hp')}</th>
              <th onClick={() => handleSort('attack_max')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.attack')}</th>
              <th onClick={() => handleSort('defense_max')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.defense')}</th>
              <th onClick={() => handleSort('sp_atk_max')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.spAtk')}</th>
              <th onClick={() => handleSort('sp_def_max')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.spDef')}</th>
              <th onClick={() => handleSort('speed_max')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.speed')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('pokemon.abilities')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
            {pokemon.map((p: Pokemon) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors cursor-pointer" onClick={() => onNavigate(p.nationalNumber)}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">#{p.nationalNumber}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="h-10 w-10 relative">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-10 w-10 object-contain" />}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex gap-1">
                    {p.types.map((t: string) => <TypeIcon key={t} type={t} size="sm" />)}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-700 dark:text-gray-300">{p.statTotal}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.hpMax}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.attackMax}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.defenseMax}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.spAtkMax}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.spDefMax}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.speedMax}</td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col text-xs">
                    <span>{p.ability1}</span>
                    {p.ability2 && <span>{p.ability2}</span>}
                    {p.abilityHidden && <span className="text-gray-400 italic">{p.abilityHidden} (H)</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pokemon.map((p: Pokemon) => (
        <div key={p.id} className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col" onClick={() => onNavigate(p.nationalNumber)}>
          {/* Card Header gradient based on types */}
          <div className="h-2 w-full" style={getCardHeaderStyle(p.types)} />

          <div className="p-4 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{String(p.nationalNumber).padStart(3, '0')}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{p.name}</h3>
                <div className="flex gap-1 mt-1.5">
                  {p.types.map((t: string) => <TypeIcon key={t} type={t} size="sm" />)}
                </div>
              </div>
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center p-2 shrink-0">
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-contain" />}
              </div>
            </div>

            {/* Stats Bars */}
            <div className="space-y-1.5 mt-auto">
              {[
                { label: 'HP', value: p.hpBase ?? 0, color: 'bg-green-500' },
                { label: 'Atk', value: p.attackBase ?? 0, color: 'bg-red-500' },
                { label: 'Def', value: p.defenseBase ?? 0, color: 'bg-orange-500' },
                { label: 'SpA', value: p.spAtkBase ?? 0, color: 'bg-purple-500' },
                { label: 'SpD', value: p.spDefBase ?? 0, color: 'bg-indigo-500' },
                { label: 'Spe', value: p.speedBase ?? 0, color: 'bg-yellow-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center text-xs gap-2">
                  <span className="w-8 font-medium text-gray-500 dark:text-gray-400">{stat.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stat.color}`}
                      style={{ width: `${Math.min((stat.value / 255) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-gray-700 dark:text-gray-300">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

MemoizedPokemonList.displayName = 'MemoizedPokemonList';

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
