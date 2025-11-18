import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

interface ItemDetail {
  id: number;
  identifier: string;
  name: string;
  category: string;
  description?: string;
  spriteUrl?: string;
}

export default function ItemDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id, router.locale],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(
        `${API_URL}/items/${id}?lang=${router.locale || 'en'}`
      );
      return response.data.data as ItemDetail;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400"></div>
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('items.detail.loading')}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {t('items.detail.error')}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/data/items"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('items.detail.backToItems')}
          </Link>

          {/* Item Details Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="px-6 py-6">
              <div className="flex items-start gap-6 mb-6">
                {/* Item Sprite */}
                {item.spriteUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={item.spriteUrl}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                )}

                {/* Item Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">{item.name}</h1>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                      {t(`items.categories.${item.category}`, { defaultValue: item.category })}
                    </span>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-700 dark:text-dark-text-primary leading-relaxed">{item.description}</p>
                  )}
                </div>
              </div>

              {/* Additional Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-dark-border">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-tertiary">{t('items.detail.identifier')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-dark-text-primary font-mono">{item.identifier}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-dark-text-tertiary">{t('items.detail.category')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-dark-text-primary">
                    {t(`items.categories.${item.category}`, { defaultValue: item.category })}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
    revalidate: 3600, // Revalidate every hour
  };
};
