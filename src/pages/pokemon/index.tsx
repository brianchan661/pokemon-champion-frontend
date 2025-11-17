import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Pokemon, ApiResponse, PaginatedResponse } from '@brianchan661/pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();
const PAGE_SIZE = 50; // Load 50 Pokemon per page

export default function PokemonListPage() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'national_number' | 'stat_total' | 'hp_max' | 'attack_max' | 'defense_max' | 'sp_atk_max' | 'sp_def_max' | 'speed_max'>('national_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const typeFilterRef = useRef<HTMLDivElement>(null);

  // Progressive loading state
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPokemon, setTotalPokemon] = useState(0);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const handleSort = (column: 'name' | 'national_number' | 'stat_total' | 'hp_max' | 'attack_max' | 'defense_max' | 'sp_atk_max' | 'sp_def_max' | 'speed_max') => {
    if (!isFullyLoaded) return; // Disable sorting until fully loaded

    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Fetch current page
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['pokemon-page', currentPage, typeFilter, locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', PAGE_SIZE.toString());
      if (typeFilter) params.append('type', typeFilter);
      params.append('lang', locale || 'en');

      const response = await axios.get<ApiResponse<PaginatedResponse<Pokemon>>>(
        `${API_URL}/pokemon?${params.toString()}`
      );
      return response.data.data;
    },
    enabled: !isFullyLoaded, // Stop fetching when fully loaded
  });

  // Progressive loading: fetch next page automatically
  useEffect(() => {
    if (pageData && !isFetchingMore) {
      // First page or new page loaded
      if (currentPage === 1) {
        // Initial load
        setAllPokemon(pageData.data);
        setTotalPokemon(pageData.total);
      } else {
        // Append to existing data
        setAllPokemon(prev => [...prev, ...pageData.data]);
      }

      // Check if there are more pages
      if (pageData.hasMore && currentPage < pageData.totalPages) {
        setIsFetchingMore(true);
        // Fetch next page after a short delay
        setTimeout(() => {
          setCurrentPage(prev => prev + 1);
          setIsFetchingMore(false);
        }, 100);
      } else {
        // All pages loaded
        setIsFullyLoaded(true);
      }
    }
  }, [pageData, currentPage, isFetchingMore]);

  // Reset when filter changes
  useEffect(() => {
    setAllPokemon([]);
    setCurrentPage(1);
    setIsFullyLoaded(false);
    setIsFetchingMore(false);
  }, [typeFilter, locale]);

  // Client-side sorting (only when fully loaded)
  const pokemon = useMemo(() => {
    if (!isFullyLoaded) {
      // Return unsorted data while loading
      return allPokemon;
    }

    return allPokemon.slice().sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'national_number':
        aValue = a.nationalNumber;
        bValue = b.nationalNumber;
        break;
      case 'stat_total':
        aValue = a.statTotal;
        bValue = b.statTotal;
        break;
      case 'hp_max':
        aValue = a.hpMax;
        bValue = b.hpMax;
        break;
      case 'attack_max':
        aValue = a.attackMax;
        bValue = b.attackMax;
        break;
      case 'defense_max':
        aValue = a.defenseMax;
        bValue = b.defenseMax;
        break;
      case 'sp_atk_max':
        aValue = a.spAtkMax;
        bValue = b.spAtkMax;
        break;
      case 'sp_def_max':
        aValue = a.spDefMax;
        bValue = b.spDefMax;
        break;
      case 'speed_max':
        aValue = a.speedMax;
        bValue = b.speedMax;
        break;
      default:
        aValue = a.nationalNumber;
        bValue = b.nationalNumber;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
    });
  }, [allPokemon, isFullyLoaded, sortBy, sortOrder]);

  const allTypes = Array.from(
    new Set(pokemon.flatMap((p) => p.types))
  ).sort();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">{t('pokemon.title')}</h1>

          {/* Loading Progress Indicator */}
          {!isFullyLoaded && allPokemon.length > 0 && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                  Loading Pokemon... {allPokemon.length} / {totalPokemon} ({Math.round((allPokemon.length / totalPokemon) * 100)}%)
                </span>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400"></div>
              </div>
              <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(allPokemon.length / totalPokemon) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                You can scroll and view loaded Pokemon. Sorting will be enabled when all Pokemon are loaded.
              </p>
            </div>
          )}

        {/* Loading State */}
        {isLoading && currentPage === 1 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('pokemon.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            {t('pokemon.error')}
          </div>
        ) : pokemon.length > 0 ? (
          <>
          {/* Pokemon Table - Desktop */}
          <div className="hidden md:block bg-white dark:bg-dark-bg-secondary rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('national_number')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      {t('pokemon.number')}
                      <SortIcon column="national_number" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap" style={{ width: '100px' }}>
                    {t('pokemon.image')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    {t('pokemon.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap relative">
                    <button
                      onClick={() => isFullyLoaded && setShowTypeFilter(!showTypeFilter)}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Filtering will be available when all Pokemon are loaded' : ''}
                    >
                      {t('pokemon.type')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTypeFilter && (
                      <div
                        ref={typeFilterRef}
                        className="absolute top-full left-0 mt-2 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg shadow-lg p-4 z-50 min-w-[200px]"
                      >
                        <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary mb-2">{t('pokemon.filterByType')}</div>
                        <div className="space-y-2">
                          <label className={`flex items-center gap-2 p-1 rounded ${isFullyLoaded ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary' : 'opacity-50 cursor-not-allowed'}`}>
                            <input
                              type="radio"
                              name="typeFilter"
                              value=""
                              checked={typeFilter === ''}
                              onChange={() => setTypeFilter('')}
                              disabled={!isFullyLoaded}
                              className={isFullyLoaded ? 'cursor-pointer' : 'cursor-not-allowed'}
                            />
                            <span className="text-sm dark:text-dark-text-primary">{t('pokemon.allTypes')}</span>
                          </label>
                          {allTypes.map((type) => (
                            <label key={type} className={`flex items-center gap-2 p-1 rounded ${isFullyLoaded ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary' : 'opacity-50 cursor-not-allowed'}`}>
                              <input
                                type="radio"
                                name="typeFilter"
                                value={type}
                                checked={typeFilter === type}
                                onChange={() => setTypeFilter(type)}
                                disabled={!isFullyLoaded}
                                className={isFullyLoaded ? 'cursor-pointer' : 'cursor-not-allowed'}
                              />
                              <TypeIcon type={type} size="sm" showLabel={true} />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('stat_total')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      {t('pokemon.stats.total')}
                      <SortIcon column="stat_total" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('hp_max')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      HP
                      <SortIcon column="hp_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('attack_max')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      Atk
                      <SortIcon column="attack_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('defense_max')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      Def
                      <SortIcon column="defense_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('sp_atk_max')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      SpA
                      <SortIcon column="sp_atk_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('sp_def_max')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      SpD
                      <SortIcon column="sp_def_max" />
                    </button>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    <button
                      onClick={() => handleSort('speed_max')}
                      disabled={!isFullyLoaded}
                      className={`flex items-center gap-1 mx-auto whitespace-nowrap ${isFullyLoaded ? 'hover:text-gray-700 dark:hover:text-dark-text-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      title={!isFullyLoaded ? 'Sorting will be available when all Pokemon are loaded' : ''}
                    >
                      Spe
                      <SortIcon column="speed_max" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    {t('pokemon.ability1')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase whitespace-nowrap">
                    {t('pokemon.ability2')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary">
                    {t('pokemon.abilityHidden')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {pokemon.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary cursor-pointer"
                    onClick={() => window.open(`/pokemon/${p.nationalNumber}`, '_blank')}
                  >
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary">
                      {p.nationalNumber}
                    </td>
                    <td className="px-2 py-1">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          loading="lazy"
                          className="object-contain mx-auto"
                          style={{ width: '80px', height: '80px' }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                      {p.name}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap">
                      <div className="flex gap-1">
                        {p.types.map((type, idx) => (
                          <TypeIcon key={idx} type={type} size="sm" />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-dark-text-primary">
                      {p.statTotal}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.hpMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.attackMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.defenseMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.spAtkMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.spDefMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-center text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.speedMax}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">
                      <Link
                        href={`/data/abilities/${p.ability1.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.ability1}
                      </Link>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.ability2 ? (
                        <Link
                          href={`/data/abilities/${p.ability2.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.ability2}
                        </Link>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary">
                      {p.abilityHidden ? (
                        <Link
                          href={`/data/abilities/${p.abilityHidden.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.abilityHidden}
                        </Link>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pokemon Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {pokemon.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow p-4 cursor-pointer hover:shadow-lg border border-gray-200 dark:border-dark-border"
                onClick={() => window.open(`/pokemon/${p.nationalNumber}`, '_blank')}
              >
                <div className="flex items-start gap-4">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      loading="lazy"
                      className="h-40 w-40 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500 dark:text-dark-text-secondary">#{p.nationalNumber}</span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">{p.name}</h3>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {p.types.map((type, idx) => (
                        <TypeIcon key={idx} type={type} size="sm" />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-dark-text-secondary">
                      <p className="font-semibold">Total: {p.statTotal}</p>
                      <p>
                        HP {p.hpMax} / Atk {p.attackMax} / Def {p.defenseMax}
                      </p>
                      <p>
                        SpA {p.spAtkMax} / SpD {p.spDefMax} / Spe {p.speedMax}
                      </p>
                      <div className="mt-2">
                        <p className="font-semibold text-gray-700 dark:text-dark-text-primary mb-1">Abilities:</p>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-dark-text-tertiary text-xs">Ability 1: </span>
                            <Link
                              href={`/data/abilities/${p.ability1.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {p.ability1}
                            </Link>
                          </div>
                          {p.ability2 && (
                            <div>
                              <span className="text-gray-500 dark:text-dark-text-tertiary text-xs">Ability 2: </span>
                              <Link
                                href={`/data/abilities/${p.ability2.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {p.ability2}
                              </Link>
                            </div>
                          )}
                          {p.abilityHidden && (
                            <div>
                              <span className="text-gray-500 dark:text-dark-text-tertiary text-xs">Hidden: </span>
                              <Link
                                href={`/data/abilities/${p.abilityHidden.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {p.abilityHidden}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-lg shadow border border-gray-200 dark:border-dark-border">
            <p className="text-gray-600 dark:text-dark-text-secondary">{t('pokemon.noResults')}</p>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
