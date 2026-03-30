import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { HeroSection } from '@/components/Home/HeroSection';
import { FeatureCard } from '@/components/Home/FeatureCard';
import { SidebarTeamsWidget } from '@/components/Home/SidebarTeamsWidget';
import { NewsSection } from '@/components/Home/NewsSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdContainer } from '@/components/Ads';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { FEATURES } from '@/config/homepage';

export default function HomePage() {
  const { t, i18n } = useTranslation('common');
  const { isPremium } = usePremiumStatus();

  // Memoize translation values with language as dependency for proper cache invalidation
  const translationValues = useMemo(() => ({
    title: t('home.title'),
    description: t('home.description')
  }), [t, i18n.language]);
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

        {/* Hero Section */}
        <HeroSection />

        {/* Data Disclaimer */}
        <div className="w-full bg-gray-50 dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border">
          <div className="container mx-auto px-4 max-w-4xl py-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 dark:text-dark-text-tertiary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary leading-relaxed">
                <span className="font-medium text-gray-600 dark:text-dark-text-primary">{t('home.dataDisclaimer.title')}</span>{' '}{t('home.dataDisclaimer.message')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Features Section */}
        <Section className="pt-8 pb-4 bg-white dark:bg-dark-bg-primary" ariaLabel="Main features">
          <ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 container mx-auto px-4">
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

        {/* Main Content Layout */}
        <Section className="pt-4 pb-6 bg-white dark:bg-dark-bg-primary" ariaLabel="Main content">
          {/* News Section - Full Width */}
          <ErrorBoundary>
            <NewsSection />
          </ErrorBoundary>

          {/* Trending Teams Widget */}
          <ErrorBoundary>
            <SidebarTeamsWidget className="container mx-auto px-4 max-w-4xl mt-8" />
          </ErrorBoundary>

          {/* Ads - Only for non-premium */}
          {!isPremium && (
            <>
              <ErrorBoundary>
                <AdContainer
                  placement="sidebar-bottom"
                  className="container mx-auto px-4 max-w-4xl mt-4 adsense-sidebar-container adsense-placeholder"
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <AdContainer
                  placement="home-bottom-banner"
                  className="container mx-auto px-4 max-w-4xl mt-4 adsense-sidebar-container adsense-placeholder"
                  style={{ minHeight: '90px' }}
                />
              </ErrorBoundary>
            </>
          )}
        </Section>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};