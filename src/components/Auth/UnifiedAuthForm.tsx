
import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { getApiBaseUrl, getBackendBaseUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface UnifiedAuthFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({ onSuccess, onError }) => {
  const { t } = useTranslation('common');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when strictly changing email (if user goes back to edit email)
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (showPassword) {
      setShowPassword(false);
      setPassword('');
    }
  };

  const handleCheckEmail = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.exists && data.hasPassword) {
        setShowPassword(true);
        return true; // proceed to password flow
      }

      return false; // proceed to magic link flow
    } catch (error) {
      console.error('Check email error:', error);
      return false; // default to magic link on error
    }
  };


  const handlePasswordLogin = async () => {
    try {
      const result = await login({ email, password });
      if (result.success) {
        onSuccess?.();
      } else {
        onError?.(result.error || 'Login failed');
      }
    } catch (error: any) {
      onError?.(error.message || 'Login failed');
    }
  };

  const handleMagicLink = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/send-login-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        onSuccess?.();
      } else {
        onError?.(data.error || 'Failed to send login email');
      }
    } catch (error) {
      console.error('Send login email error:', error);
      onError?.('An error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      onError?.('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onError?.('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      if (showPassword) {
        // Already determined user has password, try to login
        if (!password) {
          onError?.('Please enter your password');
          setIsLoading(false);
          return;
        }
        await handlePasswordLogin();
      } else {
        // First step: check if we should ask for password
        const shouldAskPassword = await handleCheckEmail();

        if (!shouldAskPassword) {
          // If not asking for password, send magic link immediately
          await handleMagicLink();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Save current URL to redirect back after OAuth
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnUrl', window.location.pathname);
    }
    // Redirect to Google OAuth endpoint with timestamp to prevent browser caching
    window.location.href = `${getBackendBaseUrl()}/api/auth/google?_t=${Date.now()}`;
  };

  if (emailSent) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.checkEmail')}</h2>
          <p className="text-gray-600 mb-6">
            {t('auth.loginEmailSent')} <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.clickLink')}
          </p>
          <button
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('auth.useDifferentEmail')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {t('auth.signInTitle')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.emailAddress')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('auth.enterEmail')}
            required
            disabled={isLoading}
          />
        </div>

        {showPassword && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <button
                type="button"
                className="text-xs text-primary-600 hover:text-primary-700"
                onClick={() => {
                  /* handle forgot password if needed, or just let them use magic link by clearing password mode? */
                  // For now, simpler is better. If they forgot, they can likely use magic link logic if we supported switching back.
                }}
              >
                {/* Forgot password endpoint not explicitly requested, skipping for now */}
              </button>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('auth.enterPassword')}
              required
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4 rounded-md hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? t('auth.processing') : (showPassword ? t('auth.signIn') : t('auth.continue'))}
        </button>
      </form>

      {!showPassword && (
        <>
          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
              </div>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('auth.signInWithGoogle')}
          </button>
        </>
      )}

      <div className="mt-6">
        <p className="text-center text-sm text-gray-600 mb-4">
          {t('auth.noAccount')}
        </p>
      </div>
    </div>
  );
};

