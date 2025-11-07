import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout/Layout';
import { LoginForm } from '@/components/Auth/LoginForm';
import { RegisterForm } from '@/components/Auth/RegisterForm';
import { UserProfile } from '@/components/Auth/UserProfile';
import { CheckEmail } from '@/components/Auth/CheckEmail';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'check-email';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const handleAuthSuccess = () => {
    // Clear any errors and redirect to home page after successful authentication
    setAuthError('');
    router.push('/');
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleEmailVerificationRequired = (email: string) => {
    setVerificationEmail(email);
    setMode('check-email');
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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            {isAuthenticated ? (
              <UserProfile />
            ) : mode === 'check-email' ? (
              <CheckEmail
                email={verificationEmail}
                onBackToLogin={() => setMode('login')}
              />
            ) : (
              <>
                {/* Mode Toggle */}
                <div className="flex mb-8 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                      mode === 'login'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                      mode === 'register'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Auth Forms */}
                {mode === 'login' ? (
                  <LoginForm
                    key="login-form"
                    onSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                    error={authError}
                    onSwitchToRegister={() => {
                      setMode('register');
                      setAuthError('');
                    }}
                  />
                ) : (
                  <RegisterForm
                    key="register-form"
                    onSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                    error={authError}
                    onSwitchToLogin={() => {
                      setMode('login');
                      setAuthError('');
                    }}
                    onEmailVerificationRequired={handleEmailVerificationRequired}
                  />
                )}
              </>
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