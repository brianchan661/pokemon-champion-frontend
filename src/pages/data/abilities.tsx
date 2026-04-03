import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

interface Ability {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  shortEffect?: string;
  isHidden?: boolean;
  pokemonCount?: number;
}

export default function AbilitiesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Ability;
    direction: 'asc' | 'desc';
  } | null>({ key: 'name', direction: 'asc' });

  // Fetch all abilities once with caching
  const { data: allAbilities, isLoading, error, refetch } = useQuery({
    queryKey: ['all-abilities', router.locale || 'en'],
    queryFn: async (): Promise<Ability[]> => {
      const response = await axios.get(
        `${API_URL}/abilities?lang=${router.locale || 'en'}`
      );
      return response.data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });

  // Client-side filtering and sorting with useMemo for performance
  const abilities = useMemo((): Ability[] => {
    if (!allAbilities) return [];

    let result = [...allAbilities];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((ability: Ability) =>
        (ability.name?.toLowerCase() || '').includes(query) ||
        (ability.identifier?.toLowerCase() || '').includes(query)
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // For description column, use shortEffect if available to match display
        if (sortConfig.key === 'description') {
          const aText = a.shortEffect || a.description || '';
          const bText = b.shortEffect || b.description || '';
          return sortConfig.direction === 'asc'
            ? aText.localeCompare(bText, router.locale || 'en')
            : bText.localeCompare(aText, router.locale || 'en');
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc'
            ? String(aValue).localeCompare(String(bValue), router.locale || 'en')
            : String(bValue).localeCompare(String(aValue), router.locale || 'en');
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [allAbilities, searchQuery, sortConfig, router.locale]);

  const requestSort = (key: keyof Ability) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Ability) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const totalCount = allAbilities?.length ?? 0;
  const filteredCount = abilities.length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
              {t('abilities.title', 'Abilities')}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-600 dark:text-dark-text-secondary">
                {t('abilities.description', 'Browse all Pokemon abilities with their descriptions')}
              </p>
              {totalCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                  {searchQuery
                    ? t('abilities.filteredCount', `${filteredCount} of ${totalCount} abilities`, { filtered: filteredCount, total: totalCount })
                    : t('abilities.totalCount', `${totalCount} abilities`, { count: totalCount })}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t('abilities.searchPlaceholder', 'Search by name or identifier...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-dark-bg-secondary transition-colors text-sm font-medium whitespace-nowrap"
              >
                {t('abilities.clearSearch', 'Clear')}
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400"
                aria-hidden="true"
              ></div>
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('abilities.loading', 'Loading abilities...')}</p>
              <span className="sr-only">Loading abilities data</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 mb-3">
                {t('abilities.error', 'Error loading abilities. Please try again.')}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                {t('abilities.retry', 'Retry')}
              </button>
            </div>
          ) : abilities && abilities.length > 0 ? (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                  <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                    <tr>
                      <th
                        className="group px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors select-none"
                        onClick={() => requestSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          {t('abilities.table.name', 'Name')}
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th
                        className="group px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors select-none"
                        onClick={() => requestSort('pokemonCount')}
                      >
                        <div className="flex items-center gap-1">
                          {t('abilities.table.pokemonCount', '# Pokemon')}
                          {getSortIcon('pokemonCount')}
                        </div>
                      </th>
                      <th
                        className="group px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors select-none"
                        onClick={() => requestSort('description')}
                      >
                        <div className="flex items-center gap-1">
                          {t('abilities.table.description', 'Description')}
                          {getSortIcon('description')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                    {abilities.map((ability) => (
                      <tr key={ability.id} className="relative hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary cursor-pointer">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/data/abilities/${ability.identifier}`}
                              className="group/link flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 after:absolute after:inset-0"
                            >
                              {ability.name}
                              <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-dark-text-primary">
                            {ability.pokemonCount ?? 0}
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4">
                          <div
                            className="text-sm text-gray-700 dark:text-dark-text-primary line-clamp-2"
                            title={ability.shortEffect || ability.description || ''}
                          >
                            {ability.shortEffect || ability.description || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : abilities && abilities.length === 0 && !isLoading ? (
            <div className="text-center py-20 bg-white dark:bg-dark-bg-secondary rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="50" cy="50" r="44" />
                <line x1="6" y1="50" x2="94" y2="50" />
                <circle cx="50" cy="50" r="12" fill="white" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="50" r="6" fill="currentColor" />
              </svg>
              <p className="text-gray-600 dark:text-dark-text-secondary font-medium">{t('abilities.noResults', 'No abilities found.')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search</p>
            </div>
          ) : null}
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
