import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { ExternalLink, Newspaper } from 'lucide-react';

export const NewsSection = () => {
  const { t } = useTranslation('common');
  return (
    <div className="bg-white dark:bg-dark-bg-secondary border-y border-gray-200 dark:border-dark-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20">
        <Newspaper className="w-5 h-5 text-red-500" />
        <h2 className="font-bold text-gray-900 dark:text-dark-text-primary text-base">
          {t('home.latestNews.header')}
        </h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-dark-text-muted">{t('home.latestNews.date')}</span>
      </div>

      {/* News Image */}
      <div className="relative w-full" style={{ aspectRatio: '16/7' }}>
        <Image
          src="/images/home/home_page_news_1.png"
          alt="Pokémon Champions pre-release preview"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 896px"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-2 leading-snug">
          {t('home.latestNews.title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4 leading-relaxed">
          {t('home.latestNews.summary')}
        </p>

        {/* Highlights */}
        <ul className="space-y-2 mb-5">
          {Array.from({ length: 7 }, (_, i) => (
            <li
              key={i}
              className="text-sm text-gray-700 dark:text-dark-text-primary leading-relaxed bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg px-4 py-2.5"
            >
              {t(`home.latestNews.highlights.${i}`)}
            </li>
          ))}
        </ul>

        {/* Tutorial Link */}
        <Link
          href="/guides/tutorial"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors bg-primary-50 dark:bg-primary-900/20 px-4 py-2.5 rounded-lg"
        >
          {t('home.latestNews.learnMore')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

      </div>
    </div>
  );
};
