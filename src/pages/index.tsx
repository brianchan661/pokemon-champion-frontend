import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { FeatureCard } from '@/components/Home/FeatureCard';
import { NewsListItem } from '@/components/Home/NewsListItem';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdContainer } from '@/components/Ads';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import axios from 'axios';

import { FEATURES } from '@/config/homepage';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

interface NewsArticle {
  id: string;
  slug: string;
  publishedAt: string;
  featuredImage: string | null;
  translations: Array<{
    language: 'en' | 'ja';
    title: string;
  }>;
  tags: string[];
}

interface HomePageProps {
  newsArticles: NewsArticle[];
}

export default function HomePage({ newsArticles }: HomePageProps) {
  const { t, i18n } = useTranslation('common');
  const { isPremium } = usePremiumStatus();

  // Memoize translation values with language as dependency for proper cache invalidation
  const translationValues = useMemo(() => ({
    title: t('home.title'),
    description: t('home.description'),
    newsViewAll: t('home.news.viewAll')
  }), [t, i18n.language]);

  // Helper to get translation for an article
  const getArticleTitle = (article: NewsArticle): string => {
    const translation = article.translations.find(t => t.language === i18n.language);
    if (!translation) {
      return article.translations.find(t => t.language === 'en')?.title || article.translations[0]?.title || '';
    }
    return translation.title;
  };

  // Memoize meta tags with more specific dependencies
  const metaTags = useMemo(() => {
    const baseTitle = translationValues.title;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemonchampion.com';

    return {
      title: `${baseTitle} | Pokemon Champion`,
      description: translationValues.description,
      keywords: "Pokemon, Champion, competitive, battle, team builder, tier list, strategy",
      canonicalUrl: siteUrl
    };
  }, [translationValues.title, translationValues.description]);

  return (
    <>
      <Head>
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />
        <meta name="keywords" content={metaTags.keywords} />
        <meta property="og:title" content={metaTags.title} />
        <meta property="og:description" content={metaTags.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTags.title} />
        <meta name="twitter:description" content={metaTags.description} />
        <link rel="canonical" href={metaTags.canonicalUrl} />
      </Head>

      <Layout>
        {/* Hidden h1 for SEO and accessibility */}
        <h1 className="sr-only">{translationValues.title}</h1>

        {/* Main Features Section */}
        <Section className="pt-8 pb-8 bg-white dark:bg-dark-bg-primary" ariaLabel="Main features">
          <ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {FEATURES.map((feature) => (
                <FeatureCard
                  key={feature.href}
                  href={feature.href}
                  backgroundImage={feature.backgroundImage}
                  title={t(`home.mainFeatures.${feature.translationKey}.title`)}
                />
              ))}
            </div>
          </ErrorBoundary>
        </Section>

        {/* Main Content with Sidebar Layout */}
        <Section className="pt-8 pb-16 bg-white dark:bg-dark-bg-primary" ariaLabel="Main content">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Game News Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-8">
                  新着情報
                </h2>
                <ErrorBoundary>
                  <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
                    {newsArticles.length > 0 ? (
                      newsArticles.slice(0, 5).map((article) => (
                        <NewsListItem
                          key={article.id}
                          href={`/news/${article.slug}`}
                          date={new Date(article.publishedAt).toLocaleDateString(i18n.language, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          title={getArticleTitle(article)}
                          thumbnail={article.featuredImage ? `${API_URL.replace('/api', '')}${article.featuredImage}` : null}
                        />
                      ))
                    ) : (
                      <div className="py-8 px-6 text-center text-gray-500 dark:text-dark-text-secondary">
                        {t('home.news.noArticles', 'No news articles yet')}
                      </div>
                    )}
                  </div>
                </ErrorBoundary>

                <div className="mt-8">
                  <Link
                    href="/news"
                    className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    aria-label={`${translationValues.newsViewAll} - Navigate to news page`}
                  >
                    {translationValues.newsViewAll}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Sidebar with Ads - pokecabook.com style */}
            {!isPremium && (
              <div className="w-full lg:w-96 xl:w-80 flex-shrink-0">
                <div className="sticky top-4">
                  <div className="space-y-8">
                    {/* Top Sidebar Ad - Rectangle */}
                    <ErrorBoundary>
                      <div className="adsense-sidebar-container">
                        <AdContainer
                          placement="sidebar-top"
                          className="w-full adsense-placeholder"
                        />
                      </div>
                    </ErrorBoundary>

                    {/* Middle Sidebar Ad - Square */}
                    <ErrorBoundary>
                      <div className="adsense-sidebar-container">
                        <AdContainer
                          placement="sidebar-middle"
                          className="w-full adsense-placeholder"
                        />
                      </div>
                    </ErrorBoundary>

                    {/* Bottom Sidebar Ad - Rectangle */}
                    <ErrorBoundary>
                      <div className="adsense-sidebar-container">
                        <AdContainer
                          placement="sidebar-bottom"
                          className="w-full adsense-placeholder"
                        />
                      </div>
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Bottom Banner Ad */}
        {!isPremium && (
          <Section className="pt-0 pb-8 bg-white dark:bg-dark-bg-primary" ariaLabel="Advertisement">
            <ErrorBoundary>
              <div className="flex justify-center">
                <div className="adsense-sidebar-container w-full max-w-4xl" style={{ minHeight: '100px' }}>
                  <AdContainer
                    placement="home-bottom-banner"
                    className="w-full adsense-placeholder"
                    style={{ minHeight: '90px' }}
                  />
                </div>
              </div>
            </ErrorBoundary>
          </Section>
        )}
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  try {
    // Fetch published news articles from the API
    const response = await axios.get(`${API_URL}/news`, {
      params: {
        language: locale || 'en',
        limit: 5,
      },
    });

    return {
      props: {
        newsArticles: response.data.articles || [],
        ...(await serverSideTranslations(locale || 'en', ['common'])),
      },
    };
  } catch (error) {
    console.error('Failed to fetch news articles for homepage:', error);

    // Return empty array if API fails - don't break the homepage
    return {
      props: {
        newsArticles: [],
        ...(await serverSideTranslations(locale || 'en', ['common'])),
      },
    };
  }
};