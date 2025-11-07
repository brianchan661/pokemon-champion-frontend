import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { GetStaticProps, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PokemonWithAbility {
  id: number;
  nationalNumber: string;
  name: string;
  types: string[];
  imageUrl: string;
  ability1: string;
  ability2?: string;
  abilityHidden?: string;
  abilitySlot: 1 | 2 | 3;
  isHiddenAbility: boolean;
}

interface AbilityDetail {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  effect?: string;
  shortEffect?: string;
  generation?: number;
  isHidden?: boolean;
  pokemon: PokemonWithAbility[];
}

export default function AbilityDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const { data: ability, isLoading, error } = useQuery({
    queryKey: ['ability', id, router.locale],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('lang', router.locale || 'en');

      const response = await axios.get(`${API_URL}/abilities/${id}/pokemon?${params.toString()}`);
      return response.data.data as AbilityDetail;
    },
    enabled: !!id,
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/data/abilities"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Abilities
          </Link>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading ability...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Error loading ability details. Please try again.
            </div>
          )}

          {/* Ability Details */}
          {ability && (
            <div>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {ability.name}
                    </h1>
                    <p className="text-sm text-gray-500 font-mono mb-2">
                      {ability.identifier}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {ability.generation && (
                      <span className="px-3 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-800">
                        Gen {ability.generation}
                      </span>
                    )}
                    {ability.isHiddenAbility && (
                      <span className="px-3 py-1 text-sm font-semibold rounded bg-purple-100 text-purple-800">
                        Hidden Ability
                      </span>
                    )}
                  </div>
                </div>

                {/* Short Effect (Flavor Text) */}
                {ability.description && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-sm font-semibold text-gray-700 mb-1">Short Effect</h2>
                    <p className="text-gray-900">{ability.description}</p>
                  </div>
                )}

                {/* Detailed Effect */}
                {ability.effect && (
                  <div className="mt-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">Detailed Effect</h2>
                    <p className="text-gray-900 leading-relaxed">{ability.effect}</p>
                  </div>
                )}
              </div>

              {/* Pokemon with this Ability */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">
                    Pokemon with {ability.name} ({ability.pokemon.length})
                  </h2>
                </div>

                {ability.pokemon.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pokemon
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ability 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ability 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hidden Ability
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ability.pokemon.map((pokemon) => (
                          <tr key={pokemon.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              #{pokemon.nationalNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/pokemon/${pokemon.nationalNumber}`}
                                className="flex items-center hover:text-primary-600"
                              >
                                {pokemon.imageUrl && (
                                  <img
                                    src={pokemon.imageUrl}
                                    alt={pokemon.name}
                                    className="w-12 h-12 mr-3"
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {pokemon.name}
                                </span>
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                {pokemon.types.map((type, idx) => (
                                  <TypeIcon key={idx} type={type} size="sm" />
                                ))}
                              </div>
                            </td>
                            {/* Ability 1 */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pokemon.ability1 ? (
                                <Link
                                  href={`/data/abilities/${pokemon.ability1.toLowerCase().replace(/\s+/g, '-')}`}
                                  className={`text-sm ${
                                    pokemon.abilitySlot === 1
                                      ? 'font-bold text-primary-600 underline'
                                      : 'text-primary-600 hover:text-primary-700 hover:underline'
                                  }`}
                                >
                                  {pokemon.ability1}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            {/* Ability 2 */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pokemon.ability2 ? (
                                <Link
                                  href={`/data/abilities/${pokemon.ability2.toLowerCase().replace(/\s+/g, '-')}`}
                                  className={`text-sm ${
                                    pokemon.abilitySlot === 2
                                      ? 'font-bold text-primary-600 underline'
                                      : 'text-primary-600 hover:text-primary-700 hover:underline'
                                  }`}
                                >
                                  {pokemon.ability2}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            {/* Hidden Ability */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pokemon.abilityHidden ? (
                                <Link
                                  href={`/data/abilities/${pokemon.abilityHidden.toLowerCase().replace(/\s+/g, '-')}`}
                                  className={`text-sm ${
                                    pokemon.abilitySlot === 3
                                      ? 'font-bold text-primary-600 underline'
                                      : 'text-primary-600 hover:text-primary-700 hover:underline'
                                  }`}
                                >
                                  {pokemon.abilityHidden}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    No Pokemon found with this ability.
                  </div>
                )}
              </div>
            </div>
          )}
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
