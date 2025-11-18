import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout/Layout';
import { UnifiedAuthForm } from '@/components/Auth/UnifiedAuthForm';
import { UserProfile } from '@/components/Auth/UserProfile';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [authError, setAuthError] = useState<string>('');

  const handleAuthSuccess = () => {
    // Clear any errors - user will be redirected after email verification
    setAuthError('');
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  if (isLoading) {
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
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <UnifiedAuthForm
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
              />
            )}
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