import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon } from '@/components/UI/MoveCategoryIcon';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

interface Move {
  id: number;
  identifier: string;
  name: string;
  type: string;
  category: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  description?: string;
  pokemonCount?: number;
}

type SortKey = 'name' | 'type' | 'category' | 'power' | 'accuracy' | 'pp';

const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const MOVE_CATEGORIES = ['physical', 'special', 'status'];

export default function MovesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  // Fetch all moves once with caching
  const {
    data: allMoves,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['all-moves', router.locale || 'en'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/moves?lang=${router.locale || 'en'}&pageSize=1000`
      );
      // Normalize category to lowercase
      const moves = response.data.data.moves.map((move: Move) => ({
        ...move,
        category: move.category?.toLowerCase()
      }));
      return moves as Move[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  }) as { data: Move[] | undefined; isLoading: boolean; error: Error | null };

  // Client-side filtering and sorting with useMemo for performance
  const filteredMoves = useMemo((): Move[] => {
    if (!allMoves) return [];

    let result: Move[] = allMoves;

    if (typeFilters.length > 0) {
      result = result.filter((move: Move) => typeFilters.includes(move.type));
    }

    if (categoryFilters.length > 0) {
      result = result.filter((move: Move) =>
        move.category && categoryFilters.includes(move.category)
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((move: Move) =>
        move.name.toLowerCase().includes(query) ||
        move.identifier.toLowerCase().includes(query)
      );
    }

    // Sort
    result = result.slice().sort((a, b) => {
      const { key, direction } = sortConfig;
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [allMoves, typeFilters, categoryFilters, searchQuery, sortConfig]);

  const totalCount = allMoves?.length ?? 0;
  const filteredCount = filteredMoves.length;

  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleCategoryFilter = (category: string) => {
    setCategoryFilters(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortConfig.key !== col) {
      return (
        <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">{t('moves.title')}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-600 dark:text-dark-text-secondary">
                {t('moves.description')}
              </p>
              {totalCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                  {searchQuery || typeFilters.length > 0 || categoryFilters.length > 0
                    ? t('moves.filteredMoves', { count: filteredCount })
                    : t('moves.totalMoves', { count: totalCount })}
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('moves.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                />
              </div>
              {(searchQuery || typeFilters.length > 0 || categoryFilters.length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilters([]);
                    setCategoryFilters([]);
                  }}
                  className="px-2 sm:px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-dark-bg-secondary transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  {t('moves.clearFilters')}
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                {t('moves.filterByType')}
                {typeFilters.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-dark-text-tertiary">
                    ({typeFilters.length} selected)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                {POKEMON_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${typeFilters.includes(type)
                      ? 'ring-2 ring-offset-1 ring-primary-500 dark:ring-offset-dark-bg-primary'
                      : 'opacity-50 hover:opacity-100'
                      }`}
                    style={{ background: 'transparent' }}
                  >
                    <TypeIcon type={type} size="sm" showLabel />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                {t('moves.filterByCategory')}
                {categoryFilters.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-dark-text-tertiary">
                    ({categoryFilters.length} selected)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCategoryFilters([])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${categoryFilters.length === 0
                    ? 'bg-gray-800 dark:bg-gray-700 text-white'
                    : 'bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-bg-secondary'
                    }`}
                >
                  {t('moves.all')}
                </button>
                {MOVE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${categoryFilters.includes(category)
                      ? 'bg-primary-600 text-white ring-2 ring-primary-500 ring-offset-2'
                      : 'bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-bg-secondary'
                      }`}
                  >
                    <MoveCategoryIcon category={category as 'physical' | 'special' | 'status'} size={20} />
                    <span>{t(`moves.categories.${category}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400"></div>
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('moves.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {t('moves.error')}
            </div>
          ) : filteredMoves.length > 0 ? (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                  <thead className="bg-gray-50 dark:bg-dark-bg-tertiary sticky top-0">
                    <tr>
                      {([
                        { key: 'name', label: t('moves.table.name'), align: 'left' },
                        { key: 'type', label: t('moves.table.type'), align: 'left' },
                        { key: 'category', label: t('moves.table.category'), align: 'left' },
                        { key: 'power', label: t('moves.table.power'), align: 'center' },
                        { key: 'accuracy', label: t('moves.table.accuracy'), align: 'center' },
                        { key: 'pp', label: t('moves.table.pp'), align: 'center' },
                      ] as { key: SortKey; label: string; align: 'left' | 'center' }[]).map(({ key, label, align }) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          className={`group px-3 py-2 sm:px-6 sm:py-3 text-${align} text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors select-none`}
                        >
                          <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
                            {label}
                            <SortIcon col={key} />
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                        {t('moves.table.description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                    {filteredMoves.map((move) => (
                      <tr key={move.id} className="relative hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary cursor-pointer">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                          <Link
                            href={`/data/moves/${move.identifier}`}
                            className="group/link flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 after:absolute after:inset-0"
                          >
                            {move.name}
                            <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                          <TypeIcon type={move.type} size="sm" />
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                          <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={20} />
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-dark-text-primary">
                          {move.power ?? '-'}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-dark-text-primary">
                          {move.accuracy ?? '-'}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-dark-text-primary">
                          {move.pp ?? '-'}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm text-gray-700 dark:text-dark-text-primary max-w-xs">
                          <div className="line-clamp-2" title={move.description || ''}>
                            {move.description || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-dark-bg-secondary rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="50" cy="50" r="44" />
                <line x1="6" y1="50" x2="94" y2="50" />
                <circle cx="50" cy="50" r="12" fill="white" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="50" r="6" fill="currentColor" />
              </svg>
              <p className="text-gray-600 dark:text-dark-text-secondary font-medium">{t('moves.noResults')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
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
