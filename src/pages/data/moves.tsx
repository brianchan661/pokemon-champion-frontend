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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
    staleTime: 30 * 60 * 1000, // 30 minutes - moves data rarely changes
    cacheTime: 60 * 60 * 1000, // 1 hour in memory
  }) as { data: Move[] | undefined; isLoading: boolean; error: Error | null };

  // Client-side filtering with useMemo for performance
  const filteredMoves = useMemo((): Move[] => {
    if (!allMoves) return [];

    let result: Move[] = allMoves;

    // Apply type filters (OR logic - match ANY selected type)
    if (typeFilters.length > 0) {
      result = result.filter((move: Move) => typeFilters.includes(move.type));
    }

    // Apply category filters (OR logic - match ANY selected category)
    if (categoryFilters.length > 0) {
      result = result.filter((move: Move) =>
        move.category && categoryFilters.includes(move.category)
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((move: Move) =>
        move.name.toLowerCase().includes(query) ||
        move.identifier.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allMoves, typeFilters, categoryFilters, searchQuery]);

  const totalCount = allMoves?.length ?? 0;
  const filteredCount = filteredMoves.length;

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilters(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('moves.title')}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-600">
                {t('moves.description')}
              </p>
              {totalCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {searchQuery || typeFilters.length > 0 || categoryFilters.length > 0
                    ? t('moves.filteredMoves', { count: filteredCount })
                    : t('moves.totalMoves', { count: totalCount })}
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search and Clear Filters */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('moves.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {(searchQuery || typeFilters.length > 0 || categoryFilters.length > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilters([]);
                    setCategoryFilters([]);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  {t('moves.clearFilters')}
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('moves.filterByType')}
                {typeFilters.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({typeFilters.length} selected)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTypeFilters([])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    typeFilters.length === 0
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('moves.all')}
                </button>
                {POKEMON_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`transition-all ${
                      typeFilters.includes(type)
                        ? 'ring-2 ring-primary-500 ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <TypeIcon type={type} size="md" />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('moves.filterByCategory')}
                {categoryFilters.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({categoryFilters.length} selected)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCategoryFilters([])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilters.length === 0
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('moves.all')}
                </button>
                {MOVE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      categoryFilters.includes(category)
                        ? 'bg-primary-600 text-white ring-2 ring-primary-500 ring-offset-2'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <MoveCategoryIcon
                      category={category as 'physical' | 'special' | 'status'}
                      size={20}
                    />
                    <span>{t(`moves.categories.${category}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600">{t('moves.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {t('moves.error')}
            </div>
          ) : filteredMoves.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.category')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.power')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.accuracy')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.pp')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('moves.table.description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMoves.map((move) => (
                      <tr key={move.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/data/moves/${move.identifier}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {move.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TypeIcon type={move.type} size="sm" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <MoveCategoryIcon
                            category={move.category as 'physical' | 'special' | 'status'}
                            size={20}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          {move.power ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          {move.accuracy ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          {move.pp ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {move.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('moves.noResults')}</p>
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
