import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon, MoveCategory } from '@/components/UI/MoveCategoryIcon';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

const SEASONS = ['M1'];
const FORMATS = ['single', 'double'] as const;
type Format = typeof FORMATS[number];

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', attack: 'Atk', defense: 'Def', sp_atk: 'SpA', sp_def: 'SpD', speed: 'Spe',
};

interface TopMove {
  rank: number;
  name: string;
  percentage: string;
  move_identifier: string | null;
  move_type: string | null;
  move_category: string | null;
}

interface RankingRow {
  id: number;
  rank: number;
  pokemon_name: string;
  pokemon_display_name: string | null;
  pokemon_id: number;
  updated_at: string | null;
  name_lower: string | null;
  image_url: string | null;
  type_1: string | null;
  type_2: string | null;
  top_moves: TopMove[];
  top_ability: string | null;
  top_ability_pct: string | null;
  top_ability_identifier: string | null;
  top_item: string | null;
  top_item_pct: string | null;
  top_item_identifier: string | null;
  top_item_sprite: string | null;
  top_nature: string | null;
  top_nature_pct: string | null;
  increased_stat: string | null;
  decreased_stat: string | null;
}

export default function RankingPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const locale = router.locale || 'en';
  const [season, setSeason] = useState('M1');
  const [format, setFormat] = useState<Format>('single');

  const { data: rankings, isLoading, error, refetch } = useQuery({
    queryKey: ['rankings', season, format, locale],
    queryFn: async (): Promise<RankingRow[]> => {
      const res = await axios.get(`${API_URL}/rankings?season=${season}&format=${format}&lang=${locale}`);
      return res.data.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('ranking.title', { season, format: t(`ranking.format.${format}`) })}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('ranking.subtitle')}
                  {rankings?.[0]?.updated_at && (
                    <span className="ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      · {t('ranking.captured', { date: new Date(rankings[0].updated_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) })}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Season filter */}
                <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                  {SEASONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSeason(s)}
                      className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                      style={season === s
                        ? { background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                        : { color: 'var(--color-text-tertiary)', border: '1px solid transparent' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {/* Format filter */}
                <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                  {FORMATS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                      style={format === f
                        ? { background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                        : { color: 'var(--color-text-tertiary)', border: '1px solid transparent' }
                      }
                    >
                      {t(`ranking.format.${f}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl animate-pulse"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl p-4 text-red-500" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="mb-3">{t('ranking.error')}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'rgba(239,68,68,0.5)' }}
              >
                {t('ranking.retry')}
              </button>
            </div>
          ) : rankings && rankings.length > 0 ? (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {/* Column header (hidden on mobile) */}
              <div
                className="hidden md:grid px-4 py-2.5 text-[11px] font-bold select-none gap-3 grid-cols-[44px_52px_minmax(130px,1fr)_minmax(110px,0.85fr)_minmax(280px,2.4fr)_minmax(130px,0.9fr)_minmax(110px,0.85fr)]"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                <span>{t('ranking.col.rank')}</span>
                <span></span>
                <span>{t('ranking.col.pokemon')}</span>
                <span>{t('ranking.section.abilities')}</span>
                <span>{t('ranking.section.moves')}</span>
                <span>{t('ranking.section.items')}</span>
                <span>{t('ranking.section.natures')}</span>
              </div>

              {/* Rows */}
              <div className="space-y-1 p-1" style={{ background: 'var(--color-bg-primary)' }}>
                {rankings.map(row => (
                  <div
                    key={row.id}
                    onClick={() => router.push(`/ranking/${season}/${format}/${row.name_lower ?? row.pokemon_name.toLowerCase()}`)}
                    className="group flex flex-col md:grid items-stretch md:items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 gap-2 md:gap-3 md:grid-cols-[44px_52px_minmax(130px,1fr)_minmax(110px,0.85fr)_minmax(280px,2.4fr)_minmax(130px,0.9fr)_minmax(110px,0.85fr)]"
                    style={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.background = 'rgba(59,130,246,0.08)';
                      el.style.border = '1px solid rgba(59,130,246,0.4)';
                      el.style.transform = 'translateY(-1px)';
                      el.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.background = 'var(--color-bg-secondary)';
                      el.style.border = '1px solid var(--color-border)';
                      el.style.transform = '';
                      el.style.boxShadow = '';
                    }}
                  >
                    {/* Identity strip — flex row on mobile, dissolves into the grid on desktop */}
                    <div className="flex items-center gap-3 md:contents">
                      {/* Rank */}
                      <div className="font-mono font-bold text-lg w-11 md:w-auto shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.rank <= 3 ? (
                          <span className={
                            row.rank === 1 ? 'text-yellow-500' :
                            row.rank === 2 ? 'text-slate-400' :
                            'text-amber-600'
                          }>
                            #{row.rank}
                          </span>
                        ) : (
                          <span className="text-sm">#{row.rank}</span>
                        )}
                      </div>

                      {/* Sprite */}
                      <div className="flex items-center justify-center shrink-0">
                        {row.image_url ? (
                          <img
                            src={row.image_url}
                            alt={row.pokemon_display_name || row.pokemon_name}
                            className="w-12 h-12 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full" style={{ background: 'var(--color-bg-tertiary)' }} />
                        )}
                      </div>

                      {/* Name + types */}
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold group-hover:text-blue-500 transition-colors truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {row.pokemon_display_name || row.pokemon_name}
                            </span>
                            <svg
                              className="w-3 h-3 shrink-0 text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <div className="flex gap-1 mt-0.5">
                            {row.type_1 && <TypeIcon type={row.type_1} size="xs" />}
                            {row.type_2 && <TypeIcon type={row.type_2} size="xs" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top ability */}
                    <div className="min-w-0">
                      <div className="md:hidden text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        {t('ranking.section.abilities')}
                      </div>
                      {row.top_ability ? (
                        <div className="flex md:block items-center gap-2 min-w-0">
                          <div className="text-xs font-medium truncate flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                            {row.top_ability}
                          </div>
                          {row.top_ability_pct && (
                            <div className="text-[10px] font-mono shrink-0 md:mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                              {parseFloat(row.top_ability_pct).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </div>

                    {/* Top 4 moves (2x2 chips) */}
                    <div className="min-w-0">
                      <div className="md:hidden text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        {t('ranking.section.moves')}
                      </div>
                      <div className="grid grid-cols-2 gap-1 min-w-0">
                      {Array.from({ length: 4 }).map((_, i) => {
                        const move = row.top_moves?.[i];
                        if (!move) {
                          return (
                            <div
                              key={i}
                              className="flex items-center h-6 px-1.5 rounded text-[10px]"
                              style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}
                            >
                              —
                            </div>
                          );
                        }
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1 h-6 px-1.5 rounded min-w-0"
                            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
                            title={`${move.name} (${parseFloat(move.percentage).toFixed(1)}%)`}
                          >
                            {move.move_type && <TypeIcon type={move.move_type} size="xs" />}
                            {move.move_category && (
                              <MoveCategoryIcon category={move.move_category as MoveCategory} size={11} />
                            )}
                            <span
                              className="text-[10px] font-medium truncate min-w-0 flex-1"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {move.name}
                            </span>
                            <span
                              className="text-[9px] font-mono shrink-0"
                              style={{ color: 'var(--color-text-tertiary)' }}
                            >
                              {parseFloat(move.percentage).toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                      </div>
                    </div>

                    {/* Top item (sprite + name + %) */}
                    <div className="min-w-0">
                      <div className="md:hidden text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        {t('ranking.section.items')}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                      {row.top_item ? (
                        <>
                          {row.top_item_sprite ? (
                            <img
                              src={row.top_item_sprite}
                              alt={row.top_item}
                              width={24}
                              height={24}
                              className="shrink-0 object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded shrink-0" style={{ background: 'var(--color-bg-tertiary)' }} />
                          )}
                          <div className="flex md:block items-center gap-2 min-w-0 flex-1">
                            <div className="text-xs font-medium truncate flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                              {row.top_item}
                            </div>
                            {row.top_item_pct && (
                              <div className="text-[10px] font-mono shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                                {parseFloat(row.top_item_pct).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                      </div>
                    </div>

                    {/* Top nature */}
                    <div className="min-w-0">
                      <div className="md:hidden text-[10px] font-bold tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        {t('ranking.section.natures')}
                      </div>
                      {row.top_nature ? (
                        <>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-medium truncate min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                              {row.top_nature}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                              {row.increased_stat && (
                                <span className="text-red-500">+{STAT_LABELS[row.increased_stat] ?? row.increased_stat}</span>
                              )}
                              {row.decreased_stat && (
                                <span className="text-blue-500">-{STAT_LABELS[row.decreased_stat] ?? row.decreased_stat}</span>
                              )}
                            </div>
                            {row.top_nature_pct && (
                              <div className="md:hidden text-[10px] font-mono shrink-0 ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                                {parseFloat(row.top_nature_pct).toFixed(1)}%
                              </div>
                            )}
                          </div>
                          {row.top_nature_pct && (
                            <div className="hidden md:block text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                              {parseFloat(row.top_nature_pct).toFixed(1)}%
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
              <p className="font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{t('ranking.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'])),
  },
  revalidate: 3600,
});
