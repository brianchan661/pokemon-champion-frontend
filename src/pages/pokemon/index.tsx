import React, { useState, useMemo, memo, useCallback } from 'react';
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
type SortKey = 'name' | 'national_number' | 'stat_total' | 'hp_base' | 'attack_base' | 'defense_base' | 'sp_atk_base' | 'sp_def_base' | 'speed_base';

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function ChampionsPokemonListPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  const currentLocale = locale || 'en';

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
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
  const [filterStatRanges, setFilterStatRanges] = useState(statRanges);
  const [sortBy, setSortBy] = useState<SortKey>('national_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [collapsedForms, setCollapsedForms] = useState<Set<number>>(new Set());
  const toggleForms = useCallback((id: number) => {
    setCollapsedForms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const {
    data: allPokemon = [] as Pokemon[],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['champions-pokemon', currentLocale, 'v1'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('lang', currentLocale);
      params.append('sortBy', 'national_number');
      params.append('order', 'asc');
      const response = await axios.get<ApiResponse<Pokemon[]>>(
        `${API_URL}/champions/pokemon?${params.toString()}`
      );
      if (Array.isArray(response.data.data)) return response.data.data;
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const baseFilteredPokemon = useMemo(() => {
    if (allPokemon.length === 0) return [];
    return allPokemon.filter((p: Pokemon) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(q);
        const numberMatch = p.nationalNumber.toString().includes(q);
        const abilityMatch = p.ability1.toLowerCase().includes(q) || (p.ability2 && p.ability2.toLowerCase().includes(q));
        if (!nameMatch && !numberMatch && !abilityMatch) return false;
      }
      if (selectedTypes.length > 0) {
        const hasType = selectedTypes.some(type => p.types.some(pt => pt.toLowerCase() === type.toLowerCase()));
        if (!hasType) return false;
      }
      return true;
    });
  }, [allPokemon, searchQuery, selectedTypes]);

  const statLimits = useMemo(() => {
    const limits = { hp: { min: 0, max: 999 }, attack: { min: 0, max: 999 }, defense: { min: 0, max: 999 }, spAtk: { min: 0, max: 999 }, spDef: { min: 0, max: 999 }, speed: { min: 0, max: 999 } };
    if (baseFilteredPokemon.length === 0) return limits;
    const findMinMax = (key: keyof Pokemon) => {
      let min = 999, max = 0;
      baseFilteredPokemon.forEach((p: Pokemon) => { const v = p[key] as number; if (v < min) min = v; if (v > max) max = v; });
      return { min, max };
    };
    limits.hp = findMinMax('hpBase');
    limits.attack = findMinMax('attackBase');
    limits.defense = findMinMax('defenseBase');
    limits.spAtk = findMinMax('spAtkBase');
    limits.spDef = findMinMax('spDefBase');
    limits.speed = findMinMax('speedBase');
    return limits;
  }, [baseFilteredPokemon]);

  const finalFilteredPokemon = useMemo(() => {
    return baseFilteredPokemon.filter((p: Pokemon) => {
      const hp = p.hpBase ?? 0, atk = p.attackBase ?? 0, def = p.defenseBase ?? 0;
      const spa = p.spAtkBase ?? 0, spd = p.spDefBase ?? 0, spe = p.speedBase ?? 0;
      if (hp < filterStatRanges.hp.min || hp > filterStatRanges.hp.max) return false;
      if (atk < filterStatRanges.attack.min || atk > filterStatRanges.attack.max) return false;
      if (def < filterStatRanges.defense.min || def > filterStatRanges.defense.max) return false;
      if (spa < filterStatRanges.spAtk.min || spa > filterStatRanges.spAtk.max) return false;
      if (spd < filterStatRanges.spDef.min || spd > filterStatRanges.spDef.max) return false;
      if (spe < filterStatRanges.speed.min || spe > filterStatRanges.speed.max) return false;
      return true;
    });
  }, [baseFilteredPokemon, filterStatRanges]);

  const sortedPokemon = useMemo(() => {
    return finalFilteredPokemon.slice().sort((a: Pokemon, b: Pokemon) => {
      let av: number | string, bv: number | string;
      switch (sortBy) {
        case 'name': av = a.name; bv = b.name; break;
        case 'national_number': av = a.nationalNumber; bv = b.nationalNumber; break;
        case 'stat_total': av = a.statTotal; bv = b.statTotal; break;
        case 'hp_base': av = a.hpBase ?? 0; bv = b.hpBase ?? 0; break;
        case 'attack_base': av = a.attackBase ?? 0; bv = b.attackBase ?? 0; break;
        case 'defense_base': av = a.defenseBase ?? 0; bv = b.defenseBase ?? 0; break;
        case 'sp_atk_base': av = a.spAtkBase ?? 0; bv = b.spAtkBase ?? 0; break;
        case 'sp_def_base': av = a.spDefBase ?? 0; bv = b.spDefBase ?? 0; break;
        case 'speed_base': av = a.speedBase ?? 0; bv = b.speedBase ?? 0; break;
        default: av = a.nationalNumber; bv = b.nationalNumber;
      }
      if (typeof av === 'string') return sortOrder === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortOrder === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [finalFilteredPokemon, sortBy, sortOrder]);

  const handleSort = useCallback((col: SortKey) => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortOrder('asc'); }
  }, [sortBy]);

  const toggleType = useCallback((type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }, []);

  const allTypes = useMemo(() => [
    'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
    'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy',
  ], []);

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

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTypes([]);
    const reset = { hp: { min: 0, max: 999 }, attack: { min: 0, max: 999 }, defense: { min: 0, max: 999 }, spAtk: { min: 0, max: 999 }, spDef: { min: 0, max: 999 }, speed: { min: 0, max: 999 } };
    setStatRanges(reset);
    setFilterStatRanges(reset);
  }, []);

  const navigate = useCallback((p: Pokemon) => {
    router.push(`/pokemon/${p.nameLower ?? toSlug(p.name)}`);
  }, [router]);

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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-lg border border-gray-200 dark:border-dark-border p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-3">{t('pokemon.filterTypes')}</h3>
                <TypeFilterGrid selectedTypes={selectedTypes} onToggle={toggleType} types={allTypes} />
              </div>
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
                              type="number" min={limitMin} max={effectiveMax} value={effectiveMin}
                              onChange={(e) => { const v = Math.min(Number(e.target.value), effectiveMax); setStatRanges(p => ({ ...p, [stat]: { ...p[statKey], min: v } })); setFilterStatRanges(p => ({ ...p, [stat]: { ...p[statKey], min: v } })); }}
                              className="w-12 text-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-xs dark:text-gray-200"
                            />
                            <span>–</span>
                            <input
                              type="number" min={effectiveMin} max={limitMax} value={effectiveMax}
                              onChange={(e) => { const v = Math.max(Number(e.target.value), effectiveMin); setStatRanges(p => ({ ...p, [stat]: { ...p[statKey], max: v } })); setFilterStatRanges(p => ({ ...p, [stat]: { ...p[statKey], max: v } })); }}
                              className="w-12 text-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-xs dark:text-gray-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-6 shrink-0">Min</span>
                            <input type="range" min={limitMin} max={limitMax} value={effectiveMin}
                              onChange={(e) => { const v = Math.min(Number(e.target.value), effectiveMax); setStatRanges(p => ({ ...p, [stat]: { ...p[statKey], min: v } })); }}
                              onMouseUp={() => setFilterStatRanges(statRanges)} onTouchEnd={() => setFilterStatRanges(statRanges)}
                              className="flex-1 accent-blue-600 dark:accent-blue-400 h-1 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-6 shrink-0">Max</span>
                            <input type="range" min={limitMin} max={limitMax} value={effectiveMax}
                              onChange={(e) => { const v = Math.max(Number(e.target.value), effectiveMin); setStatRanges(p => ({ ...p, [stat]: { ...p[statKey], max: v } })); }}
                              onMouseUp={() => setFilterStatRanges(statRanges)} onTouchEnd={() => setFilterStatRanges(statRanges)}
                              className="flex-1 accent-blue-600 dark:accent-blue-400 h-1 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">{t('pokemon.loadingDatabase')}</span>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              Failed to load Pokemon data.
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{t('pokemon.showingResults', { shown: sortedPokemon.length, total: allPokemon.length })}</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {t('pokemon.clearAllFilters')}
              </button>
            )}
          </div>

          {/* Main Content */}
          <ChampionsPokemonList
            pokemon={sortedPokemon}
            loading={isLoading}
            viewMode={viewMode}
            handleSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onNavigate={navigate}
            collapsedForms={collapsedForms}
            onToggleForms={toggleForms}
          />
        </div>
      </div>
    </Layout>
  );
}

// --- Sub-components ---
interface ChampionsPokemonListProps {
  pokemon: Pokemon[];
  loading: boolean;
  viewMode: ViewMode;
  handleSort: (col: SortKey) => void;
  sortBy: SortKey;
  sortOrder: 'asc' | 'desc';
  onNavigate: (p: Pokemon) => void;
  collapsedForms: Set<number>;
  onToggleForms: (id: number) => void;
}

const TableSortIcon = ({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: 'asc' | 'desc' }) => {
  if (sortBy !== column) return <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
  return sortOrder === 'asc'
    ? <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
    : <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
};

const ChampionsPokemonList = memo(({ pokemon, loading, viewMode, handleSort, sortBy, sortOrder, onNavigate, collapsedForms, onToggleForms }: ChampionsPokemonListProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();

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
              <th onClick={() => handleSort('national_number')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-1">#<TableSortIcon column="national_number" sortBy={sortBy} sortOrder={sortOrder} /></div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">{t('pokemon.image')}</th>
              <th onClick={() => handleSort('name')} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-1">{t('pokemon.name')}<TableSortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} /></div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('pokemon.type')}</th>
              <th onClick={() => handleSort('stat_total')} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center justify-center gap-1">{t('pokemon.stats.total')}<TableSortIcon column="stat_total" sortBy={sortBy} sortOrder={sortOrder} /></div>
              </th>
              <th onClick={() => handleSort('hp_base')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.hp')}</th>
              <th onClick={() => handleSort('attack_base')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.attack')}</th>
              <th onClick={() => handleSort('defense_base')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.defense')}</th>
              <th onClick={() => handleSort('sp_atk_base')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.spAtk')}</th>
              <th onClick={() => handleSort('sp_def_base')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.spDef')}</th>
              <th onClick={() => handleSort('speed_base')} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">{t('pokemon.stats.speed')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('pokemon.abilities')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
            {pokemon.map((p: Pokemon) => (
              <React.Fragment key={p.id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors cursor-pointer"
                  onClick={() => onNavigate(p)}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      #{p.nationalNumber}
                      {p.forms && p.forms.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleForms(p.id); }}
                          className="ml-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title={!collapsedForms.has(p.id) ? 'Hide forms' : `Show ${p.forms.length} form${p.forms.length > 1 ? 's' : ''}`}
                        >
                          <svg className={`w-3.5 h-3.5 transition-transform ${!collapsedForms.has(p.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="h-10 w-10 relative">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-10 w-10 object-contain" />}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      {p.types.map((type: string) => <TypeIcon key={type} type={type} size="sm" />)}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-700 dark:text-gray-300">{p.statTotal}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.hpBase}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.attackBase}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.defenseBase}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.spAtkBase}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.spDefBase}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{p.speedBase}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col text-xs">
                      <span>{p.ability1}</span>
                      {p.ability2 && <span>{p.ability2}</span>}
                    </div>
                  </td>
                </tr>
                {p.forms && p.forms.length > 0 && !collapsedForms.has(p.id) && p.forms.map((form: any) => (
                  <tr
                    key={form.formName}
                    className="bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 cursor-pointer border-l-2 border-blue-300 dark:border-blue-700"
                    onClick={() => form.nameLower && router.push(`/pokemon/${form.nameLower}`)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500 pl-8">↳</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="h-10 w-10 relative">
                        {form.imageUrl && <img src={form.imageUrl} alt={form.formName} loading="lazy" className="h-10 w-10 object-contain" />}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{form.formName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex gap-1">
                        {form.types.map((t: string) => <TypeIcon key={t} type={t} size="sm" />)}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-bold text-gray-700 dark:text-gray-300">{form.baseStats?.total ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{form.baseStats?.hp?.base ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{form.baseStats?.attack?.base ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{form.baseStats?.defense?.base ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{form.baseStats?.spAtk?.base ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{form.baseStats?.spDef?.base ?? '-'}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{form.baseStats?.speed?.base ?? '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col text-xs">
                        {form.abilities?.slice(0, 2).map((a: string, i: number) => <span key={i}>{a}</span>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pokemon.map((p: Pokemon) => (
        <div key={p.id} className="flex flex-col gap-2">
          <div
            className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
            onClick={() => onNavigate(p)}
          >
            <div className="h-2 w-full" style={getCardHeaderStyle(p.types)} />
            <div className="p-4 flex flex-col gap-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{String(p.nationalNumber).padStart(3, '0')}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{p.name}</h3>
                  <div className="flex gap-1 mt-1.5">
                    {p.types.map((type: string) => <TypeIcon key={type} type={type} size="sm" />)}
                  </div>
                </div>
                <div className="w-20 h-20 rounded-full flex items-center justify-center p-2 shrink-0"
                  style={{ background: `radial-gradient(circle, ${getTypeHex(p.types[0] ?? 'normal')}18 0%, transparent 70%)` }}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-contain" />}
                </div>
              </div>
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
                      <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${Math.min((stat.value / 255) * 100, 100)}%` }} />
                    </div>
                    <span className="w-6 text-right text-gray-700 dark:text-gray-300">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {p.forms && p.forms.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleForms(p.id); }}
                className="flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-700 transition-colors"
              >
                <svg className={`w-3 h-3 transition-transform ${!collapsedForms.has(p.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {!collapsedForms.has(p.id) ? 'Hide forms' : `${p.forms.length} form${p.forms.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {p.forms && p.forms.length > 0 && !collapsedForms.has(p.id) && (
            <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-blue-300 dark:border-blue-700">
              {p.forms.map((form: any) => (
                <div
                  key={form.formName}
                  className="bg-blue-50/70 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 flex items-center gap-3 cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/20 transition-colors"
                  onClick={() => form.nameLower && router.push(`/pokemon/${form.nameLower}`)}
                >
                  <div className="w-10 h-10 shrink-0">
                    {form.imageUrl && <img src={form.imageUrl} alt={form.formName} loading="lazy" className="w-10 h-10 object-contain" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{form.formName}</p>
                    <div className="flex gap-1 mt-0.5">
                      {form.types.map((t: string) => <TypeIcon key={t} type={t} size="xs" />)}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0">{form.baseStats?.total ?? '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

ChampionsPokemonList.displayName = 'ChampionsPokemonList';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'])),
  },
});
