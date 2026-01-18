import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { GetStaticProps, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

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
  isHiddenAbility?: boolean;
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
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/data/abilities"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-6"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Abilities
          </Link>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400"></div>
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">Loading ability...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              Error loading ability details. Please try again.
            </div>
          ) : ability ? (
            <div>
              {/* Header */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
                      {ability.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-dark-text-tertiary font-mono mb-2">
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

                {/* Effect */}
                {(ability.shortEffect || ability.effect || ability.description) && (
                  <div className="mt-4">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">Effect</h2>
                    <p className="text-gray-900 dark:text-dark-text-primary leading-relaxed">
                      {ability.shortEffect || ability.effect || ability.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Pokemon with this Ability */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                    Pokemon with {ability.name} ({ability.pokemon.length})
                  </h2>
                </div>

                {ability.pokemon.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                      <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                            Pokemon
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                            Ability 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                            Ability 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                            Hidden Ability
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                        {ability.pokemon.map((pokemon) => (
                          <tr key={pokemon.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-tertiary">
                              #{pokemon.nationalNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/pokemon/${pokemon.nationalNumber}`}
                                className="flex items-center hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {pokemon.imageUrl && (
                                  <img
                                    src={pokemon.imageUrl}
                                    alt={pokemon.name}
                                    className="w-12 h-12 mr-3"
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
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
                                  className={`text-sm ${pokemon.abilitySlot === 1
                                      ? 'font-bold text-primary-600 dark:text-primary-400 underline'
                                      : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline'
                                    }`}
                                >
                                  {pokemon.ability1}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-dark-text-tertiary">-</span>
                              )}
                            </td>
                            {/* Ability 2 */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pokemon.ability2 ? (
                                <Link
                                  href={`/data/abilities/${pokemon.ability2.toLowerCase().replace(/\s+/g, '-')}`}
                                  className={`text-sm ${pokemon.abilitySlot === 2
                                      ? 'font-bold text-primary-600 dark:text-primary-400 underline'
                                      : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline'
                                    }`}
                                >
                                  {pokemon.ability2}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-dark-text-tertiary">-</span>
                              )}
                            </td>
                            {/* Hidden Ability */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {pokemon.abilityHidden ? (
                                <Link
                                  href={`/data/abilities/${pokemon.abilityHidden.toLowerCase().replace(/\s+/g, '-')}`}
                                  className={`text-sm ${pokemon.abilitySlot === 3
                                      ? 'font-bold text-primary-600 dark:text-primary-400 underline'
                                      : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline'
                                    }`}
                                >
                                  {pokemon.abilityHidden}
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-dark-text-tertiary">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-dark-text-secondary">
                    No Pokemon found with this ability.
                  </div>
                )}
              </div>
            </div>
          ) : null}
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
