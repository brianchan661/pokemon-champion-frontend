import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TutorialPage() {
  const { t } = useTranslation('tutorial');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const TutorialImage = ({ src, alt }: { src: string; alt: string }) => (
    <img 
      src={src} 
      alt={alt} 
      className="w-full rounded-xl shadow-sm border border-gray-200 dark:border-dark-border object-cover cursor-pointer hover:opacity-90 transition-opacity" 
      onClick={() => setFullScreenImage(src)}
    />
  );

  return (
    <>
      <Head>
        <title>{t('title')} | Pokemon Champion</title>
        <meta name="description" content={t('intro')} />
      </Head>

      <Layout>
        <Section className="pt-12 pb-24 bg-gray-50 dark:bg-dark-bg-primary min-h-screen" ariaLabel="Tutorial Content">
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-dark-text-primary mb-16 text-center tracking-tight">
              {t('title')}
            </h1>

            <ErrorBoundary>
              <div className="space-y-12">
                
                {/* Getting Pokemon */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-dark-border">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-6 flex items-center">
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold">1</span>
                    {t('gettingPokemon.title')}
                  </h2>
                  <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-dark-text-secondary text-lg leading-relaxed mb-8">
                    <ul className="space-y-4">
                      <li><strong>Pokémon HOME:</strong> {t('gettingPokemon.home')}</li>
                      <li><strong>Scout:</strong> {t('gettingPokemon.scout')}</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <TutorialImage src="/images/tutorial/tutorial_1_a.png" alt="Getting Pokemon" />
                    <TutorialImage src="/images/tutorial/tutorial_1_b.png" alt="Scouting Pokemon" />
                  </div>
                </div>

                {/* Battle Basics */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-dark-border">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-6 flex items-center">
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold">2</span>
                    {t('battleBasics.title')}
                  </h2>
                  <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-dark-text-secondary text-lg leading-relaxed space-y-5 mb-8">
                    <p>{t('battleBasics.team')}</p>
                    <p>{t('battleBasics.mechanics')}</p>
                    <p>{t('battleBasics.formats')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <TutorialImage src="/images/tutorial/tutorial_2_a.png" alt="Battle preparation" />
                    <TutorialImage src="/images/tutorial/tutorial_2_b.png" alt="Battle gameplay" />
                  </div>
                </div>

                {/* Online Battle Modes */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-dark-border">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-6 flex items-center">
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold">3</span>
                    {t('battleModes.title')}
                  </h2>
                  <div className="overflow-x-auto mb-8">
                    <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-dark-border">
                      <thead className="bg-gray-100 dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="p-4 border-b border-gray-200 dark:border-dark-border">{t('tableHeaders.mode')}</th>
                          <th className="p-4 border-b border-gray-200 dark:border-dark-border">{t('tableHeaders.description')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-border text-gray-600 dark:text-dark-text-secondary text-base">
                        <tr className="bg-gray-50 dark:bg-dark-bg-primary hover:bg-white dark:hover:bg-dark-bg-secondary transition-colors">
                          <td className="p-5 font-bold w-1/4 border-r border-gray-100 dark:border-dark-border">{t('battleModes.ranked').split(':')[0]}</td>
                          <td className="p-5">{t('battleModes.ranked').split(':')[1] || t('battleModes.ranked')}</td>
                        </tr>
                        <tr className="bg-gray-50 dark:bg-dark-bg-primary hover:bg-white dark:hover:bg-dark-bg-secondary transition-colors">
                          <td className="p-5 font-bold w-1/4 border-r border-gray-100 dark:border-dark-border">{t('battleModes.casual').split(':')[0]}</td>
                          <td className="p-5">{t('battleModes.casual').split(':')[1] || t('battleModes.casual')}</td>
                        </tr>
                        <tr className="bg-gray-50 dark:bg-dark-bg-primary hover:bg-white dark:hover:bg-dark-bg-secondary transition-colors">
                          <td className="p-5 font-bold w-1/4 border-r border-gray-100 dark:border-dark-border">{t('battleModes.private').split(':')[0]}</td>
                          <td className="p-5">{t('battleModes.private').split(':')[1] || t('battleModes.private')}</td>
                        </tr>
                        <tr className="bg-gray-50 dark:bg-dark-bg-primary hover:bg-white dark:hover:bg-dark-bg-secondary transition-colors">
                          <td className="p-5 font-bold w-1/4 border-r border-gray-100 dark:border-dark-border">{t('battleModes.tournament').split(':')[0]}</td>
                          <td className="p-5">{t('battleModes.tournament').split(':')[1] || t('battleModes.tournament')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <TutorialImage src="/images/tutorial/tutorial_3_a.png" alt="Online battle modes" />
                    <TutorialImage src="/images/tutorial/tutorial_3_b.png" alt="Matchmaking" />
                  </div>
                </div>

                {/* VP System */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-dark-border">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-6 flex items-center">
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold">4</span>
                    {t('vpSystem.title')}
                  </h2>
                  <p className="text-gray-600 dark:text-dark-text-secondary text-lg leading-relaxed mb-6">{t('vpSystem.intro')}</p>
                  <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-dark-text-secondary text-lg leading-relaxed mb-8">
                    <ul className="space-y-4">
                      <li>{t('vpSystem.training')}</li>
                      <li>{t('vpSystem.scoutExtensions')}</li>
                      <li>{t('vpSystem.shop')}</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                    <TutorialImage src="/images/tutorial/tutorial_4_a.png" alt="Training section" />
                    <TutorialImage src="/images/tutorial/tutorial_4_b.png" alt="Customizing EVs" />
                    <TutorialImage src="/images/tutorial/tutorial_4_c.png" alt="Scouting multiple times" />
                    <TutorialImage src="/images/tutorial/tutorial_4_d.png" alt="VP Shop" />
                    <TutorialImage src="/images/tutorial/tutorial_4_e.png" alt="Purchasing items" />
                    <TutorialImage src="/images/tutorial/tutorial_4_f.png" alt="Customizing avatar" />
                  </div>
                </div>

              </div>
            </ErrorBoundary>
          </div>
        </Section>
        {/* Fullscreen Image Modal */}
        {fullScreenImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 cursor-pointer"
            onClick={() => setFullScreenImage(null)}
          >
            <img 
              src={fullScreenImage} 
              alt="Fullscreen View" 
              className="max-w-full max-h-full rounded-lg shadow-2xl object-scale-down" 
            />
            <button 
              className="absolute top-6 right-6 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
              aria-label="Close fullscreen image"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common', 'tutorial'])),
    },
  };
};
