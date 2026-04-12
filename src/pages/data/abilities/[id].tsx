import { useState } from 'react';
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

interface AbilityPokemon {
  national_number: string;
  name_lower: string;
  name: string;
  name_en: string;
  type_1: string;
  type_2: string | null;
  image_url: string | null;
  ability_1: string | null;
  ability_2: string | null;
  ability_3: string | null;
}

interface ChampionsAbilityDetail {
  identifier: string;
  name: string;
  name_en: string;
  description: string | null;
  blocks_role_play: boolean | null;
  blocks_power_of_alchemy: boolean | null;
  blocks_entrainment: boolean | null;
  blocks_trace: boolean | null;
  blocks_skill_swap: boolean | null;
  blocks_gastro_acid: boolean | null;
  removed_by_mold_breaker: boolean | null;
  not_used_if_transformed: boolean | null;
  pokemon: AbilityPokemon[];
}

const FLAG_DEFS: { key: keyof ChampionsAbilityDetail; i18nKey: string }[] = [
  { key: 'blocks_role_play',        i18nKey: 'abilities.mechanics.blocksRolePlay' },
  { key: 'blocks_power_of_alchemy', i18nKey: 'abilities.mechanics.blocksPowerOfAlchemy' },
  { key: 'blocks_entrainment',      i18nKey: 'abilities.mechanics.blocksEntrainment' },
  { key: 'blocks_trace',            i18nKey: 'abilities.mechanics.blocksTrace' },
  { key: 'blocks_skill_swap',       i18nKey: 'abilities.mechanics.blocksSkillSwap' },
  { key: 'blocks_gastro_acid',      i18nKey: 'abilities.mechanics.blocksGastroAcid' },
  { key: 'removed_by_mold_breaker', i18nKey: 'abilities.mechanics.removedByMoldBreaker' },
  { key: 'not_used_if_transformed', i18nKey: 'abilities.mechanics.notUsedIfTransformed' },
];

function FlagBadge({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-xs text-gray-400 dark:text-dark-text-secondary">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      No
    </span>
  );
}

export default function AbilityDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [interactionsOpen, setInteractionsOpen] = useState(false);

  const { data: ability, isLoading, error } = useQuery({
    queryKey: ['champions-ability', id, router.locale],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/champions/abilities/${id}?lang=${router.locale || 'en'}`);
      return res.data.data as ChampionsAbilityDetail;
    },
    enabled: !!id,
  });

  const hasAnyFlag = ability && FLAG_DEFS.some(f => ability[f.key] !== null);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Back */}
          <Link
            href="/data/abilities"
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('abilities.title')}
          </Link>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400" />
              <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">{t('abilities.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {t('abilities.error')}
            </div>
          ) : ability ? (
            <div className="space-y-6">

              {/* Header card */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
                      {ability.name}
                    </h1>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {ability.pokemon.length} {t('nav.pokemon')}
                  </span>
                </div>

                {ability.description && (
                  <p className="mt-4 text-gray-700 dark:text-dark-text-primary leading-relaxed border-t border-gray-100 dark:border-dark-border pt-4">
                    {ability.description}
                  </p>
                )}
              </div>

              {/* Boolean flags */}
              {hasAnyFlag && (
                <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                  <button
                    onClick={() => setInteractionsOpen(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-500 dark:text-dark-text-secondary">
                      {t('abilities.mechanics.title')}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${interactionsOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {interactionsOpen && (
                    <div className="px-6 pb-5 border-t border-gray-100 dark:border-dark-border pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                        {FLAG_DEFS.map(({ key, i18nKey }) => (
                          <div key={key} className="flex items-center justify-between gap-3 py-1 border-b border-gray-100 dark:border-dark-border last:border-0">
                            <span className="text-sm text-gray-700 dark:text-dark-text-primary">{t(i18nKey)}</span>
                            <FlagBadge value={ability[key] as boolean | null} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pokemon list */}
              <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">
                    {t('abilities.pokemonWithAbility', { abilityName: ability.name })}
                  </h2>
                </div>

                {ability.pokemon.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                      <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                        <tr>
                          {['#', t('moves.detail.pokemonTable.pokemon'), t('moves.detail.pokemonTable.type'), 'Ability 1', 'Ability 2', 'Hidden'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                        {ability.pokemon.map(p => (
                          <tr
                            key={p.national_number}
                            onClick={() => router.push(`/pokemon/${p.name_lower}`)}
                            className="group hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-secondary font-mono">
                              #{p.national_number}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {p.image_url && (
                                  <img src={p.image_url} alt={p.name} className="w-10 h-10 object-contain" />
                                )}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{p.name}</span>
                                  <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex gap-1">
                                <TypeIcon type={p.type_1} size="sm" />
                                {p.type_2 && <TypeIcon type={p.type_2} size="sm" />}
                              </div>
                            </td>
                            {[p.ability_1, p.ability_2, p.ability_3].map((ab, i) => (
                              <td key={i} className="px-4 py-3 whitespace-nowrap text-sm">
                                {ab ? (
                                  <span className={ab === ability.identifier
                                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-dark-text-secondary'
                                  }>
                                    {ab}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-dark-text-secondary">
                    {t('moves.detail.noPokemon')}
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

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'])),
  },
  revalidate: 3600,
});
