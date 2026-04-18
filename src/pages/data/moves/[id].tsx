import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon } from '@/components/UI/MoveCategoryIcon';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';
import { getTypeHex, getCardHeaderStyle } from '@/utils/typeColors';

const API_URL = getApiBaseUrl();

interface PokemonWithMove {
  national_number: string;
  name_lower: string;
  name: string;
  type_1: string;
  type_2: string | null;
  image_url: string;
}

interface MoveDetail {
  identifier: string;
  name: string;
  type: string;
  category: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  speed_priority?: number;
  effect_battle?: string;
  pokemon: PokemonWithMove[];
}

export default function MoveDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const { data: move, isLoading, error } = useQuery({
    queryKey: ['champions-move', id, router.locale],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(
        `${API_URL}/champions/moves/${id}?lang=${router.locale || 'en'}`
      );
      return response.data.data as MoveDetail;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400"></div>
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('moves.detail.loading')}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !move) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {t('moves.detail.error')}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/data/moves"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('moves.detail.backToMoves')}
          </Link>

          {/* Move Details Card */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{move.name}</h1>
                <div className="flex items-center gap-3">
                  <TypeIcon type={move.type} size="md" showLabel={true} />
                  <MoveCategoryIcon
                    category={move.category as 'physical' | 'special' | 'status'}
                    size={24}
                    showLabel={true}
                  />
                </div>
              </div>

              {/* Move Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-1">{t('moves.detail.power')}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {move.power ?? '-'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-1">{t('moves.detail.accuracy')}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {move.accuracy ? `${move.accuracy}%` : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-1">{t('moves.detail.pp')}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {move.pp ?? '-'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-1">{t('moves.detail.priority')}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {move.speed_priority !== undefined ? (move.speed_priority > 0 ? `+${move.speed_priority}` : move.speed_priority) : '0'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {move.effect_battle && (
                <div className="mt-6 border-l-4 pl-4" style={{ borderColor: getTypeHex(move.type) }}>
                  <h2 className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary mb-1">{t('moves.detail.description')}</h2>
                  <p className="text-gray-900 dark:text-dark-text-primary leading-relaxed">{move.effect_battle}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pokemon that can learn this move */}
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                {t('moves.detail.pokemonTitle', { moveName: move.name })}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                {move.pokemon.length}
              </span>
            </div>

            {move.pokemon.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {move.pokemon.map((pokemon) => {
                    const types = [pokemon.type_1, pokemon.type_2].filter(Boolean) as string[];
                    return (
                      <Link
                        key={pokemon.name_lower}
                        href={`/pokemon/${pokemon.name_lower}`}
                        className="group"
                      >
                        <div className="bg-white dark:bg-dark-bg-tertiary rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
                          <div className="h-1.5 w-full" style={getCardHeaderStyle(types)} />
                          <div className="p-2">
                            <div className="relative w-full h-20 mb-1">
                              {pokemon.image_url && (
                                <img
                                  src={pokemon.image_url}
                                  alt={pokemon.name}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-500 dark:text-dark-text-tertiary text-center">
                                #{pokemon.national_number}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary text-center truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                {pokemon.name}
                              </div>
                              <div className="flex gap-1 justify-center">
                                {types.map((type, idx) => (
                                  <TypeIcon key={idx} type={type} size="sm" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="50" cy="50" r="44" />
                  <line x1="6" y1="50" x2="94" y2="50" />
                  <circle cx="50" cy="50" r="12" fill="white" stroke="currentColor" strokeWidth="3" />
                  <circle cx="50" cy="50" r="6" fill="currentColor" />
                </svg>
                <p className="text-gray-600 dark:text-dark-text-secondary font-medium">{t('moves.detail.noPokemon')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
    revalidate: 3600, // Revalidate every hour
  };
};
