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
  isHidden?: boolean;
  pokemonCount?: number;
}

export default function AbilitiesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

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
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });

  // Client-side filtering with useMemo for performance
  const abilities = useMemo((): Ability[] => {
    if (!allAbilities) return [];
    
    if (!searchQuery) return allAbilities;
    
    const query = searchQuery.toLowerCase();
    return allAbilities.filter((ability: Ability) =>
      ability.name.toLowerCase().includes(query) ||
      ability.identifier.toLowerCase().includes(query) ||
      ability.description?.toLowerCase().includes(query)
    );
  }, [allAbilities, searchQuery]);

  const totalCount = allAbilities?.length ?? 0;
  const filteredCount = abilities.length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('abilities.title', 'Abilities')}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-600">
                {t('abilities.description', 'Browse all Pokemon abilities with their descriptions')}
              </p>
              {totalCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {searchQuery
                    ? t('abilities.filteredCount', `${filteredCount} of ${totalCount} abilities`, { filtered: filteredCount, total: totalCount })
                    : t('abilities.totalCount', `${totalCount} abilities`, { count: totalCount })}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder={t('abilities.searchPlaceholder', 'Search abilities...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap"
              >
                {t('abilities.clearSearch', 'Clear')}
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12" role="status" aria-live="polite">
              <div 
                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"
                aria-hidden="true"
              ></div>
              <p className="mt-4 text-gray-600">{t('abilities.loading', 'Loading abilities...')}</p>
              <span className="sr-only">Loading abilities data</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 mb-3">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('abilities.table.name', 'Name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('abilities.table.pokemonCount', '# Pokemon')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('abilities.table.description', 'Description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {abilities.map((ability) => (
                      <tr key={ability.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/data/abilities/${ability.identifier}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {ability.name}
                            </Link>
                            {ability.isHidden && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                                {t('abilities.hiddenAbility', 'Hidden Ability')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {ability.pokemonCount ?? 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {ability.description || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : abilities && abilities.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('abilities.noResults', 'No abilities found.')}</p>
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
