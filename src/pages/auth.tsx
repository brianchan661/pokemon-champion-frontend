import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout/Layout';
import { UnifiedAuthForm } from '@/components/Auth/UnifiedAuthForm';
import { useAuth } from '@/contexts/AuthContext';


export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to return URL or home
      const returnUrl = (router.query.returnUrl as string) ||
        sessionStorage.getItem('returnUrl') ||
        '/';

      // Clear session storage if it was used
      if (sessionStorage.getItem('returnUrl')) {
        sessionStorage.removeItem('returnUrl');
      }

      router.push(returnUrl);
    }
  }, [isAuthenticated, router]);

  const handleAuthSuccess = () => {
    // Auth context update will trigger the useEffect redirect
    setAuthError('');
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  // Show loading state while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Authentication | Pokemon Champion</title>
        <meta name="description" content="Sign in or create an account for Pokemon Champion" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <UnifiedAuthForm
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};