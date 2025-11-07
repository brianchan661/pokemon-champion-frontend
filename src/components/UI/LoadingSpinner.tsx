import { useTranslation } from 'next-i18next';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

/**
 * Reusable loading spinner with optional message
 */
export const LoadingSpinner = ({ 
  message, 
  size = 'md',
  className = '' 
}: LoadingSpinnerProps) => {
  const { t } = useTranslation('common');
  const displayMessage = message || t('common.loading', 'Loading...');

  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`} />
      {displayMessage && (
        <span className="ml-3 text-gray-600">{displayMessage}</span>
      )}
    </div>
  );
};
