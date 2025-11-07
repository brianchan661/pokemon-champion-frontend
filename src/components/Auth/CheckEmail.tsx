import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import axios from 'axios';

interface CheckEmailProps {
  email: string;
  onBackToLogin?: () => void;
}

export const CheckEmail: React.FC<CheckEmailProps> = ({ email, onBackToLogin }) => {
  const { t } = useTranslation('common');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`,
        { email }
      );

      if (response.data.success) {
        setResendMessage({
          type: 'success',
          text: t('auth.verificationEmailResent') || 'Verification email sent! Please check your inbox.'
        });
      }
    } catch (error: any) {
      setResendMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to resend verification email'
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
          <svg
            className="h-6 w-6 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('auth.checkEmail')}
        </h2>

        <p className="text-gray-600 mb-6">
          {t('auth.verificationEmailSent')}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 font-medium">{email}</p>
        </div>

        {resendMessage && (
          <div
            className={`mb-4 px-4 py-3 rounded ${
              resendMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {resendMessage.text}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isResending ? t('auth.resending') || 'Resending...' : t('auth.resendEmail')}
          </button>

          <button
            onClick={onBackToLogin}
            className="w-full text-primary-600 hover:text-primary-700 font-medium py-2"
          >
            {t('auth.backToLogin')}
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>{t('auth.didNotReceive')}</p>
          <p className="mt-2">{t('auth.checkSpam') || 'Please check your spam folder'}</p>
        </div>
      </div>
    </div>
  );
};
