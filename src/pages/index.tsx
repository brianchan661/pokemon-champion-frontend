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
        <div className="w-full bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-900/30">
          <div className="container mx-auto px-4 max-w-4xl py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                <span className="font-semibold">{t('home.dataDisclaimer.title')}</span> {t('home.dataDisclaimer.message')}
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
        <Section className="pt-4 pb-16 bg-white dark:bg-dark-bg-primary" ariaLabel="Main content">
          {/* News Section - Full Width */}
          <ErrorBoundary>
            <div className="mb-8">
              <NewsSection />
            </div>
          </ErrorBoundary>

          {/* Other Content - Constrained Width */}
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-8">
              {/* Trending Teams Widget */}
              <ErrorBoundary>
                <SidebarTeamsWidget />
              </ErrorBoundary>

              {/* Bottom Ad - Only for non-premium */}
              {!isPremium && (
                <ErrorBoundary>
                  <AdContainer
                    placement="sidebar-bottom"
                    className="w-full adsense-sidebar-container adsense-placeholder"
                  />
                </ErrorBoundary>
              )}
            </div>
          </div>
        </Section>

        {/* Bottom Banner Ad - Outside sidebar */}
        {!isPremium && (
          <Section className="pt-0 pb-8 bg-white dark:bg-dark-bg-primary" ariaLabel="Advertisement">
            <ErrorBoundary>
              <div className="flex justify-center">
                <AdContainer
                  placement="home-bottom-banner"
                  className="w-full max-w-4xl adsense-sidebar-container adsense-placeholder"
                  style={{ minHeight: '90px' }}
                />
              </div>
            </ErrorBoundary>
          </Section>
        )}
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