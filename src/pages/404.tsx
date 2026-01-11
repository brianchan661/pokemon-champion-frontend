import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout/Layout';

export default function Custom404() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            {/* 404 Icon */}
            <div className="mb-8">
              <svg
                className="mx-auto h-32 w-32 text-gray-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-9xl font-bold text-gray-900 dark:text-dark-text-primary">404</h1>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary">
              {t('error.notFound.title')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
              {t('error.notFound.description')}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t('error.notFound.goHome')}
            </Link>

            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-dark-border text-base font-medium rounded-md text-gray-700 dark:text-dark-text-primary bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-dark-surface/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t('error.notFound.goBack')}
            </button>
          </div>

          <div className="mt-12">
            <div className="text-sm text-gray-500 dark:text-dark-text-tertiary">
              <p>{t('error.notFound.popularPages')}:</p>
              <div className="mt-2 space-y-1">
                <Link href="/" className="block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors">
                  {t('nav.home')}
                </Link>
                <Link href="/pokemon" className="block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors">
                  {t('nav.pokemon')}
                </Link>
              </div>
            </div>
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
