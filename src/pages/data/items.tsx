import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout/Layout';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/utils/api';
import { ITEM_CATEGORIES } from '@/constants/pokemon';
import { ErrorMessage } from '@/components/UI/ErrorMessage';
import { useDebounce } from '@/hooks/useDebounce';

interface Item {
  id: number;
  identifier: string;
  name: string;
  category: string;
  description?: string;
  spriteUrl?: string;
}

export default function ItemsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  
  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch all items once with caching
  const {
    data: allItems,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['all-items', router.locale || 'en'],
    queryFn: () => api.get<Item[]>('/items', { lang: router.locale || 'en' }),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  }) as { data: Item[] | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  // Client-side filtering with useMemo for performance
  const filteredItems = useMemo((): Item[] => {
    if (!allItems) return [];

    let result: Item[] = allItems;

    // Apply category filters (OR logic - match ANY selected category)
    if (categoryFilters.length > 0) {
      result = result.filter((item: Item) => categoryFilters.includes(item.category));
    }

    // Apply search filter (using debounced value)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((item: Item) =>
        item.name.toLowerCase().includes(query) ||
        item.identifier.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allItems, categoryFilters, debouncedSearchQuery]);

  const totalCount = allItems?.length ?? 0;
  const filteredCount = filteredItems.length;

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('items.title')}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-600">
                {t('items.description')}
              </p>
              {totalCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {searchQuery || categoryFilters.length > 0
                    ? t('items.filteredItems', { count: filteredCount })
                    : t('items.totalItems', { count: totalCount })}
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('items.search')}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('items.search')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('items.filterByCategory')}
                {categoryFilters.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({categoryFilters.length} selected)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilters([])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilters.length === 0
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('items.allCategories')}
                </button>
                {ITEM_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      categoryFilters.includes(category)
                        ? 'bg-primary-600 text-white ring-2 ring-primary-500 ring-offset-2'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t(`items.categories.${category}`, { defaultValue: category })}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || categoryFilters.length > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilters([]);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('items.clearFilters')}
              </button>
            )}
          </div>


          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600">{t('items.loading')}</p>
            </div>
          ) : error ? (
            <ErrorMessage 
              error={error} 
              onRetry={() => refetch()} 
              context={t('items.title')}
            />
          ) : filteredItems.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('items.table.sprite')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('items.table.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('items.table.category')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('items.table.description')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.spriteUrl && (
                            <Image
                              src={item.spriteUrl}
                              alt={item.name}
                              width={30}
                              height={30}
                              style={{ width: 'auto', height: 'auto' }}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/data/items/${item.identifier}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t(`items.categories.${item.category}`, { defaultValue: item.category })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('items.noResults')}</p>
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
