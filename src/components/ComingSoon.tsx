import { useTranslation } from 'next-i18next';
import { Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-2xl opacity-50"></div>
            <div className="relative bg-primary-50 dark:bg-primary-900/10 rounded-full p-6">
              <Sparkles className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>

        {/* Description */}
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          {description || t('comingSoon.description', 'This feature is currently under development and will be available soon.')}
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border border-primary-200 dark:border-gray-700 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
          </span>
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {t('comingSoon.status', 'Coming Soon')}
          </span>
        </div>

      </div>
    </div>
  );
}
