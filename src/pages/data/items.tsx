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
import { ErrorMessage } from '@/components/UI/ErrorMessage';
import { useDebounce } from '@/hooks/useDebounce';

interface Item {
  id: number;
  identifier: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  spriteUrl?: string;
}

const CATEGORIES = ['tool', 'berry', 'mega-stone'] as const;
const SUBCATEGORIES = ['power-up', 'recovery', 'stat-boost', 'defense', 'other'] as const;

export default function ItemsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data: allItems,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['champions-items', router.locale || 'en'],
    queryFn: () => api.get<Item[]>('/champions/items', { lang: router.locale || 'en' }),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  }) as { data: Item[] | undefined; isLoading: boolean; error: Error | null; refetch: () => void };

  const filteredItems = useMemo((): Item[] => {
    if (!allItems) return [];
    let result = allItems;

    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }
    if (subcategoryFilter) {
      result = result.filter((item) => item.subcategory === subcategoryFilter);
    }
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.identifier.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allItems, categoryFilter, subcategoryFilter, debouncedSearchQuery]);

  const totalCount = allItems?.length ?? 0;
  const filteredCount = filteredItems.length;
  const isFiltered = !!(searchQuery || categoryFilter || subcategoryFilter);

  const handleCategoryClick = (cat: string) => {
    if (categoryFilter === cat) {
      setCategoryFilter('');
      setSubcategoryFilter('');
    } else {
      setCategoryFilter(cat);
      setSubcategoryFilter('');
    }
  };

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-dark-bg-primary min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">{t('items.title')}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-600 dark:text-dark-text-secondary">{t('items.description')}</p>
                {totalCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                    {isFiltered
                      ? t('items.filteredItems', { count: filteredCount })
                      : t('items.totalItems', { count: totalCount })}
                  </span>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 mb-6 space-y-4">
              {/* Search */}
              <div>
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('items.search')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  {t('items.filterByCategory')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        categoryFilter === cat
                          ? 'bg-primary-600 text-white ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-bg-secondary'
                          : 'bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-bg-secondary'
                      }`}
                    >
                      {t(`items.categories.${cat}`, { defaultValue: cat })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory Filter — only shown when tool is selected */}
              {categoryFilter === 'tool' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    {t('items.filterBySubcategory')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUBCATEGORIES.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSubcategoryFilter(subcategoryFilter === sub ? '' : sub)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          subcategoryFilter === sub
                            ? 'bg-secondary-600 text-white ring-2 ring-secondary-500 ring-offset-2 dark:ring-offset-dark-bg-secondary'
                            : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-secondary'
                        }`}
                      >
                        {t(`items.subcategories.${sub}`, { defaultValue: sub })}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {isFiltered && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('');
                    setSubcategoryFilter('');
                  }}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  {t('items.clearFilters')}
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
                <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('items.loading')}</p>
              </div>
            ) : error ? (
              <ErrorMessage
                error={error}
                onRetry={() => refetch()}
                context={t('items.title')}
              />
            ) : filteredItems.length > 0 ? (
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                    <thead className="bg-gray-50 dark:bg-dark-bg-tertiary sticky top-0 hidden sm:table-header-group">
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                          {t('items.table.sprite')}
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                          {t('items.table.name')}
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                          {t('items.table.category')}
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                          {t('items.table.description')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="relative hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary cursor-pointer hidden sm:table-row">
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
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
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                            <Link
                              href={`/data/items/${item.identifier}`}
                              className="group/link flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 after:absolute after:inset-0"
                            >
                              {item.name}
                              <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-bg-tertiary text-gray-800 dark:text-dark-text-primary">
                              {item.subcategory
                                ? t(`items.subcategories.${item.subcategory}`, { defaultValue: item.subcategory })
                                : t(`items.categories.${item.category}`, { defaultValue: item.category })}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4">
                            <div className="text-sm text-gray-700 dark:text-dark-text-primary line-clamp-2 max-w-sm" title={item.description || ''}>
                              {item.description || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Mobile rows */}
                      {filteredItems.map((item) => (
                        <tr key={`mobile-${item.id}`} className="relative flex flex-wrap items-center p-4 border-b border-gray-200 dark:border-dark-border sm:hidden hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary cursor-pointer">
                          <td className="w-10">
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
                          <td className="flex-1 px-2">
                            <Link
                              href={`/data/items/${item.identifier}`}
                              className="group/link flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 after:absolute after:inset-0"
                            >
                              {item.name}
                              <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                          <td className="w-auto">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-bg-tertiary text-gray-800 dark:text-dark-text-primary">
                              {item.subcategory
                                ? t(`items.subcategories.${item.subcategory}`, { defaultValue: item.subcategory })
                                : t(`items.categories.${item.category}`, { defaultValue: item.category })}
                            </span>
                          </td>
                          <td className="w-full mt-1 text-sm text-gray-600 dark:text-dark-text-secondary line-clamp-2" title={item.description || ''}>
                            {item.description || '-'}
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
                <p className="text-gray-600 dark:text-dark-text-secondary font-medium">{t('items.noResults')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
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
