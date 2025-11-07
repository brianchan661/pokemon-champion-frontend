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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PokemonWithMove {
  id: number;
  nationalNumber: string;
  name: string;
  types: string[];
  imageUrl: string;
}

interface MoveDetail {
  id: number;
  identifier: string;
  name: string;
  type: string;
  category: string;
  power?: number;
  accuracy?: number;
  pp?: number;
  priority?: number;
  description?: string;
  pokemon: PokemonWithMove[];
}

export default function MoveDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const { data: move, isLoading, error } = useQuery({
    queryKey: ['move', id, router.locale],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(
        `${API_URL}/moves/${id}/pokemon?lang=${router.locale || 'en'}`
      );
      return response.data.data as MoveDetail;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600">{t('moves.detail.loading')}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !move) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {t('moves.detail.error')}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/data/moves"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('moves.detail.backToMoves')}
          </Link>

          {/* Move Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{move.name}</h1>
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-1">{t('moves.detail.power')}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {move.power ?? '-'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-1">{t('moves.detail.accuracy')}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {move.accuracy ? `${move.accuracy}%` : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-1">{t('moves.detail.pp')}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {move.pp ?? '-'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-1">{t('moves.detail.priority')}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {move.priority !== undefined ? (move.priority > 0 ? `+${move.priority}` : move.priority) : '0'}
                  </div>
                </div>
              </div>

              {/* Description */}
              {move.description && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h2 className="text-sm font-semibold text-gray-700 mb-1">{t('moves.detail.description')}</h2>
                  <p className="text-gray-900">{move.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pokemon that can learn this move */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {t('moves.detail.pokemonTitle', { moveName: move.name })} {t('moves.detail.pokemonCount', { count: move.pokemon.length })}
              </h2>
            </div>

            {move.pokemon.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {move.pokemon.map((pokemon) => (
                    <Link
                      key={pokemon.id}
                      href={`/pokemon/${pokemon.nationalNumber}`}
                      className="group"
                    >
                      <div className="bg-gray-50 rounded-lg p-2 hover:bg-gray-100 hover:shadow-md transition-all border border-gray-200 hover:border-primary-300">
                        {/* Pokemon Image */}
                        <div className="relative w-full h-20 mb-1">
                          {pokemon.imageUrl && (
                            <img
                              src={pokemon.imageUrl}
                              alt={pokemon.name}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>

                        {/* Pokemon Info */}
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500 text-center">
                            #{pokemon.nationalNumber}
                          </div>
                          <div className="text-sm font-medium text-gray-900 text-center truncate group-hover:text-primary-600">
                            {pokemon.name}
                          </div>
                          <div className="flex gap-1 justify-center">
                            {pokemon.types.map((type, idx) => (
                              <TypeIcon key={idx} type={type} size="sm" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                {t('moves.detail.noPokemon')}
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
