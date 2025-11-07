import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Icon } from '@/components/UI/Icon';

export const HeroSection = () => {
  const { t } = useTranslation('common');

  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/pokemon" 
              className="btn-primary bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold inline-flex items-center gap-2"
            >
              <Icon path="M19 11H5m14-7H5m14 14H5" size="md" className="text-primary-600" />
              {t('home.hero.explorePokemon')}
            </Link>
            <Link 
              href="/teams" 
              className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold inline-flex items-center gap-2"
            >
              <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" size="md" className="text-current" />
              {t('home.hero.buildTeam')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};