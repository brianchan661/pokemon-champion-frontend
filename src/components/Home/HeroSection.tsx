import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { ArrowRight, Swords, List, Search } from 'lucide-react';

export const HeroSection = () => {
  const { t } = useTranslation('common');

  return (
    <div className="relative bg-white dark:bg-dark-bg-secondary w-full border-b border-gray-200 dark:border-dark-border overflow-hidden">
      {/* Background decoration */}
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.png"
          alt="Pokemon Stadium"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 42%' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-32 z-20 pointer-events-none">
        {/* Empty container to maintain height if needed, or we can adjust padding */}
      </div>
    </div>
  );
};