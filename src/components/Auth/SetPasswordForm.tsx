import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { getApiBaseUrl } from '@/config/api';

interface SetPasswordFormProps {
  token: string;
  email: string;
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
}

export const SetPasswordForm: React.FC<SetPasswordFormProps> = ({
  token,
  email,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
  };

  const validateForm = (): boolean => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setLocalError('Please fill in all fields');
      return false;
    }

    if (formData.username.length < 2) {
      setLocalError('Username must be at least 2 characters long');
      return false;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setLocalError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        onSuccess(data.data.token);
      } else {
        const errorMsg = data.error || 'Failed to complete registration';
        setLocalError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      console.error('Complete registration error:', error);
      const errorMsg = 'An error occurred. Please try again.';
      setLocalError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        {t('auth.completeProfile')}
      </h2>
      <p className="text-center text-gray-600 mb-6">
        {email}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {localError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {localError}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.username')}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('auth.chooseUsername')}
            required
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('auth.usernameHelper')}
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('auth.createPassword')}
            required
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('auth.passwordHelper')}
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('auth.confirmYourPassword')}
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4 rounded-md hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? t('auth.creatingAccount') : t('auth.completeRegistration')}
        </button>
      </form>
    </div>
  );
};
