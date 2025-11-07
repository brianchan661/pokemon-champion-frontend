import { useTranslation } from 'next-i18next';

interface ErrorMessageProps {
  error: Error | unknown;
  onRetry?: () => void;
  context?: string;
}

/**
 * Reusable error message component with retry functionality
 * Provides user-friendly error messages with actionable guidance
 */
export function ErrorMessage({ error, onRetry, context }: ErrorMessageProps) {
  const { t } = useTranslation('common');
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : t('errors.unknown');
  
  const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                         errorMessage.toLowerCase().includes('fetch');
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <svg 
          className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold mb-1">
            {context ? t('errors.contextTitle', { context }) : t('errors.title')}
          </h3>
          
          <p className="text-red-700 text-sm mb-3">
            {errorMessage}
          </p>
          
          {isNetworkError && (
            <p className="text-red-600 text-sm mb-3">
              {t('errors.networkSuggestion')}
            </p>
          )}
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              {t('errors.retry')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
