import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon, MoveCategory } from '@/components/UI/MoveCategoryIcon';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getApiBaseUrl } from '@/config/api';
import { getTypeHex } from '@/utils/typeColors';
import { ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { useTheme } from '@/hooks/useTheme';

const API_URL = getApiBaseUrl();

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChampionsMoveEntry {
  identifier: string;
  nameEn: string;
  nameJa: string | null;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effectPct: string | null;
  description: string | null;
}

interface ChampionsAbilityDetail {
  identifier: string;
  nameEn: string;
  nameJa: string | null;
  descriptionEn: string | null;
  descriptionJa: string | null;
}

interface PokemonBase {
  id: number;
  nationalNumber: number;
  name: string;
  types: string[];
  ability1: string;
  ability2?: string;
  imageUrl?: string;
  hpBase?: number;
  attackBase?: number;
  defenseBase?: number;
  spAtkBase?: number;
  spDefBase?: number;
  speedBase?: number;
  statTotal: number;
}

interface ChampionsPokemonDetail {
  base: PokemonBase;
  forms: PokemonBase[];
  moves: ChampionsMoveEntry[];
  abilities: ChampionsAbilityDetail[];
  species: string | null;
  height: string | null;
  weight: string | null;
  genderRatio: string | null;
}

// ─── Stat Formula ─────────────────────────────────────────────────────────────

const FIXED_LEVEL = 50;
const EV_STAT_MAX = 32;

function calcStat(base: number, sp: number, natureMod: number, isHp: boolean): number {
  const inner = Math.floor((2 * base + 31) * FIXED_LEVEL / 100);
  if (isHp) return inner + FIXED_LEVEL + 10 + sp;
  return Math.floor((inner + 5 + sp) * natureMod);
}

const STAT_CONFIG = [
  { key: 'hpBase'      as keyof PokemonBase, label: 'HP',  color: '#4ade80', idx: 0 },
  { key: 'attackBase'  as keyof PokemonBase, label: 'Atk', color: '#f87171', idx: 1 },
  { key: 'defenseBase' as keyof PokemonBase, label: 'Def', color: '#fb923c', idx: 2 },
  { key: 'spAtkBase'   as keyof PokemonBase, label: 'SpA', color: '#c084fc', idx: 3 },
  { key: 'spDefBase'   as keyof PokemonBase, label: 'SpD', color: '#818cf8', idx: 4 },
  { key: 'speedBase'   as keyof PokemonBase, label: 'Spe', color: '#fbbf24', idx: 5 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTable({ pokemon, t }: { pokemon: PokemonBase; t: (key: string) => string }) {
  return (
    <table className="w-full text-base font-mono border-collapse">
      <thead>
        <tr>
          <th className="pb-2 text-left w-12" />
          <th className="pb-2 pr-4 text-right text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 border-r-[3px] border-gray-300 dark:border-white/40">
            {t('pokemon.detail.statColBase')}
          </th>
          <th className="pb-2 pl-4 text-right text-sm font-semibold tracking-wide text-sky-500 dark:text-sky-400 w-[18%]">
            <span className="inline-flex items-center gap-1">
              {t('pokemon.detail.statColLowered')}
              <span title="0 SP, ×0.9 nature" className="cursor-help text-[10px] font-bold leading-none w-3.5 h-3.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-500 dark:text-sky-400 inline-flex items-center justify-center">?</span>
            </span>
          </th>
          <th className="pb-2 text-right text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 w-[18%]">
            {t('pokemon.detail.statColNoSP')}
          </th>
          <th className="pb-2 text-right text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 w-[18%]">
            {t('pokemon.detail.statColMaxSP')}
          </th>
          <th className="pb-2 text-right text-sm font-semibold tracking-wide text-orange-500 dark:text-orange-400 w-[18%]">
            <span className="inline-flex items-center gap-1">
              {t('pokemon.detail.statColBoosted')}
              <span title="32 SP, ×1.1 nature" className="cursor-help text-[10px] font-bold leading-none w-3.5 h-3.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-500 dark:text-orange-400 inline-flex items-center justify-center">?</span>
            </span>
          </th>
        </tr>
        <tr>
          <td colSpan={6} className="pb-2">
            <div className="h-px bg-gray-100 dark:bg-white/5" />
          </td>
        </tr>
      </thead>
      <tbody>
        {STAT_CONFIG.map(({ key, label, color, idx }) => {
          const base = (pokemon[key] as number) ?? 0;
          const isHp = idx === 0;
          const v0    = calcStat(base, 0,           1,   isHp);
          const v32   = calcStat(base, EV_STAT_MAX, 1,   isHp);
          const vToku = calcStat(base, EV_STAT_MAX, isHp ? 1 : 1.1, isHp);
          const vDown = calcStat(base, 0,           isHp ? 1 : 0.9, isHp);
          return (
            <tr key={key} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-sm text-gray-600 dark:text-gray-200">{label}</span>
                </span>
              </td>
              <td className="py-1.5 pr-4 text-right tabular-nums text-sm text-gray-600 dark:text-gray-300 border-r-[3px] border-gray-300 dark:border-white/40">{base}</td>
              <td className="py-1.5 pl-4 text-right tabular-nums font-bold text-sky-600 dark:text-sky-400">{isHp ? v0 : vDown}</td>
              <td className="py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{v0}</td>
              <td className="py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{v32}</td>
              <td className="py-1.5 text-right tabular-nums font-bold text-orange-600 dark:text-orange-400">{isHp ? v32 : vToku}</td>
            </tr>
          );
        })}
        <tr>
          <td colSpan={6} className="pt-1 pb-0.5">
            <div className="h-px bg-gray-100 dark:bg-white/5" />
          </td>
        </tr>
        <tr>
          <td className="py-1.5">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-200 pl-4">Total</span>
          </td>
          <td className="py-1.5 pr-4 text-right tabular-nums text-sm font-bold text-gray-700 dark:text-gray-300 border-r-[3px] border-gray-300 dark:border-white/40">{pokemon.statTotal}</td>
          <td /><td /><td /><td />
        </tr>
      </tbody>
    </table>
  );
}

function FormCard({ form, basePokemon, onClick }: { form: PokemonBase; basePokemon?: PokemonBase; onClick: () => void }) {
  const { t } = useTranslation('common');
  const [showFullStats, setShowFullStats] = useState(false);
  const primaryType = form.types[0]?.toLowerCase() ?? 'normal';
  const accent = getTypeHex(primaryType);

  return (
    <div
      className="w-full text-left flex flex-col p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200"
      style={{ background: `${accent}05` }}
    >
      {/* Clickable Header Area with Compact Stats */}
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onClick}>
        <div
          className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: `radial-gradient(circle, ${accent}25, ${accent}05)` }}
        >
          {form.imageUrl && (
            <img src={form.imageUrl} alt={form.name} className="w-12 h-12 object-contain drop-shadow" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight group-hover:text-blue-500 transition-colors">{form.name}</p>
          <div className="flex gap-1 mt-1">
            {form.types.map((type: string) => <TypeIcon key={type} type={type} size="xs" />)}
          </div>
          <div className="flex flex-wrap gap-x-2 mt-1">
            {[form.ability1, form.ability2, (form as any).abilityHidden].filter(Boolean).map((ab: string) => (
              <span key={ab} className="text-[11px] text-gray-500 dark:text-gray-400">{ab}</span>
            ))}
          </div>
        </div>
        
        {/* Compact Base Stats */}
        <div className="shrink-0 text-right">
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">{form.statTotal} BST</span>
          <table className="mt-1 font-mono text-[10px] sm:text-xs border-collapse">
            <tbody>
              {STAT_CONFIG.map(({ key, label, color }) => {
                const val = (form[key as keyof PokemonBase] as number) ?? 0;
                const baseVal = basePokemon ? (basePokemon[key as keyof PokemonBase] as number) ?? 0 : null;
                const diff = baseVal !== null ? val - baseVal : null;
                const isBuff = diff !== null && diff > 0;
                const isNerf = diff !== null && diff < 0;
                return (
                  <tr key={key}>
                    <td className="pr-1.5 sm:pr-2 py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="hidden sm:inline text-gray-400 dark:text-gray-500">{label}</span>
                      </span>
                    </td>
                    <td className="text-right tabular-nums text-gray-700 dark:text-gray-300 pr-1.5 sm:pr-2">{val}</td>
                    {diff !== null && (
                      <td className={`text-right tabular-nums w-6 sm:w-8 ${isBuff ? 'text-green-500/90' : isNerf ? 'text-red-400/90' : 'text-gray-300 dark:text-gray-600'}`}>
                        {isBuff ? `+${diff}` : isNerf ? `${diff}` : '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Toggle Action */}
      <div className="flex justify-center mt-2.5">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowFullStats(!showFullStats); }}
          className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-black/5 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
        >
          {showFullStats ? t('pokemon.detail.hideCalcStats') : t('pokemon.detail.showCalcStats')}
          <svg className={`w-3 h-3 transition-transform ${showFullStats ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Table */}
      {showFullStats && (
        <div className="w-full overflow-x-auto mt-2 pt-3 border-t border-gray-200/50 dark:border-white/5">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-white/5 text-gray-400">
                <th className="pb-1 text-left w-6"></th>
                <th className="pb-1 pr-2 text-right">Base</th>
                <th className="pb-1 pl-2 text-right text-sky-500/80">Low</th>
                <th className="pb-1 text-right">NoSP</th>
                <th className="pb-1 text-right">MaxSP</th>
                <th className="pb-1 text-right text-orange-500/80">Boost</th>
              </tr>
            </thead>
            <tbody>
              {STAT_CONFIG.map(({ key, label, color, idx }) => {
                const base = (form[key as keyof PokemonBase] as number) ?? 0;
                const isHp = idx === 0;
                const v0    = calcStat(base, 0,           1,   isHp);
                const v32   = calcStat(base, EV_STAT_MAX, 1,   isHp);
                const vToku = calcStat(base, EV_STAT_MAX, isHp ? 1 : 1.1, isHp);
                const vDown = calcStat(base, 0,           isHp ? 1 : 0.9, isHp);
                return (
                  <tr key={key} className="border-b border-white/[0.02] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-semibold text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
                    </td>
                    <td className="py-1 pr-2 text-right tabular-nums border-r border-gray-200/50 dark:border-white/5">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{base}</span>
                    </td>
                    <td className="py-1 pl-2 text-right tabular-nums text-sky-600 dark:text-sky-400/80">{isHp ? v0 : vDown}</td>
                    <td className="py-1 text-right tabular-nums text-gray-500 dark:text-gray-400">{v0}</td>
                    <td className="py-1 text-right tabular-nums text-gray-500 dark:text-gray-400">{v32}</td>
                    <td className="py-1 text-right tabular-nums font-bold text-orange-600 dark:text-orange-400/90">{isHp ? v32 : vToku}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MoveRow({ move, onClick, showEffect }: { move: ChampionsMoveEntry; onClick: () => void; showEffect: boolean }) {
  const { t } = useTranslation('common');
  return (
    <div
      onClick={onClick}
      className="group rounded-lg cursor-pointer transition-all duration-150 overflow-hidden"
      style={{ border: '1px solid rgba(128,128,128,0.15)' }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = 'rgba(59,130,246,0.15)';
        el.style.border = '1px solid rgba(99,160,255,1)';
        el.style.boxShadow = '0 0 0 1px rgba(99,160,255,0.4), 0 4px 20px rgba(59,130,246,0.2)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = '';
        el.style.border = '1px solid rgba(128,128,128,0.15)';
        el.style.boxShadow = '';
        el.style.transform = '';
      }}
    >
      <div className="grid items-center px-3 py-2.5" style={{ gridTemplateColumns: '2fr 1fr 1fr 3rem 3rem 3rem' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors truncate">{move.nameEn}</span>
          <svg className="w-3 h-3 shrink-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          <TypeIcon type={move.type} size="sm" />
          <span className="hidden sm:inline text-sm font-medium text-gray-900 dark:text-dark-text-primary">{t(`types.${move.type.toLowerCase()}`, { defaultValue: move.type })}</span>
        </div>
        <div><MoveCategoryIcon category={move.category as MoveCategory} /></div>
        <div className="text-center font-mono text-sm tabular-nums text-gray-700 dark:text-gray-300">
          {move.power !== null ? <span className="font-bold">{move.power}</span> : <span className="text-gray-400">—</span>}
        </div>
        <div className="text-center font-mono text-sm text-gray-700 dark:text-gray-400 tabular-nums">
          {move.accuracy ?? <span className="text-gray-400">—</span>}
        </div>
        <div className="text-center font-mono text-sm text-gray-700 dark:text-gray-500 tabular-nums">{move.pp ?? '—'}</div>
      </div>
      {showEffect && move.description && (
        <div className="px-3 pb-2.5 -mt-1" onClick={e => e.stopPropagation()}>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200/50 dark:border-white/10 pt-2">{move.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChampionsPokemonDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id: slug } = router.query;
  const { locale } = router;
  const currentLocale = locale || 'en';

  const [moveTypeFilter, setMoveTypeFilter] = useState<string | null>(null);
  const [moveCategoryFilter, setMoveCategoryFilter] = useState<string | null>(null);
  const [showMoveEffects, setShowMoveEffects] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const prev = theme;
    setTheme('dark');
    return () => setTheme(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['champions-pokemon-detail', slug, currentLocale],
    queryFn: async () => {
      const response = await axios.get<ApiResponse<ChampionsPokemonDetail>>(
        `${API_URL}/champions/pokemon/${slug}?lang=${currentLocale}`
      );
      return response.data.data as ChampionsPokemonDetail;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

  const pokemon = data?.base;
  const primaryType = pokemon?.types[0]?.toLowerCase() ?? 'normal';
  const secondaryType = pokemon?.types[1]?.toLowerCase();
  const accentColor = getTypeHex(primaryType);
  const secondaryColor = secondaryType ? getTypeHex(secondaryType) : accentColor;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-6 px-4">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
            <div className="rounded-2xl overflow-hidden bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border h-64 animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !pokemon || !data) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {t('pokemon.title')}
            </button>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-300">
              {t('pokemon.detail.notFound.title')}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-dark-bg-primary py-6 px-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Back link */}
          <button
            onClick={() => router.push('/pokemon')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('pokemon.title')}
          </button>

          {/* ── Main card ── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="flex flex-col sm:flex-row">

              {/* Left 50%: image */}
              <div className="sm:w-1/2 shrink-0 self-stretch">
                <div
                  className="relative flex items-center justify-center p-6 h-full"
                  style={{
                    background: secondaryType && secondaryType !== primaryType
                      ? `linear-gradient(160deg, ${accentColor}30 0%, ${secondaryColor}20 100%)`
                      : `${accentColor}18`,
                  }}
                >
                  <p className="absolute top-3 left-4 text-lg font-mono font-semibold text-gray-600 dark:text-gray-400 tracking-widest">
                    #{String(pokemon.nationalNumber).padStart(3, '0')}
                  </p>
                  {(pokemon.imageUrl) ? (
                    <img
                      src={pokemon.imageUrl}
                      alt={pokemon.name}
                      className="max-w-full max-h-full object-contain"
                      style={{ filter: `drop-shadow(0 6px 20px ${accentColor}55)` }}
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  )}
                </div>
              </div>

              {/* Right 50%: identity + stats */}
              <div className="relative sm:w-1/2 min-w-0 p-5 flex flex-col gap-4 border-t sm:border-t-0 sm:border-l" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

                {/* Types — top-right corner */}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  {pokemon.types.map((type: string) => (
                    <TypeIcon key={type} type={type} size="sm" showLabel />
                  ))}
                </div>

                {/* Name */}
                <div>
                  <h1
                    className="text-3xl font-black text-white leading-none"
                    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
                  >
                    {pokemon.name}
                  </h1>
                </div>

                {/* Stat table */}
                <StatTable pokemon={pokemon} t={t} />

              </div>
            </div>

            {/* Abilities — full width bottom row */}
            {data.abilities.length > 0 && (
              <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-gray-400 mb-2 font-mono">
                  {t('pokemon.abilities')}
                </p>
                <div className="space-y-1">
                  {data.abilities.map((ab: ChampionsAbilityDetail) => {
                    const abName = (currentLocale === 'ja' && ab.nameJa) ? ab.nameJa : ab.nameEn;
                    const abDesc = (currentLocale === 'ja' && ab.descriptionJa) ? ab.descriptionJa : ab.descriptionEn;
                    return (
                      <div
                        key={ab.identifier}
                        onClick={() => router.push(`/data/abilities/${ab.identifier}`)}
                        className="group flex flex-col sm:flex-row items-start gap-2 sm:gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
                        style={{ border: '1px solid rgba(128,128,128,0.15)' }}
                        onMouseEnter={e => {
                          const el = e.currentTarget;
                          el.style.background = 'rgba(59,130,246,0.15)';
                          el.style.border = '1px solid rgba(99,160,255,1)';
                          el.style.boxShadow = '0 0 0 1px rgba(99,160,255,0.4), 0 4px 20px rgba(59,130,246,0.2)';
                          el.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget;
                          el.style.background = '';
                          el.style.border = '1px solid rgba(128,128,128,0.15)';
                          el.style.boxShadow = '';
                          el.style.transform = '';
                        }}
                      >
                        <div className="flex items-center gap-1.5 shrink-0 sm:pt-0.5 w-full sm:w-32 lg:w-40">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded text-sm font-bold text-white"
                            style={{ background: accentColor }}
                          >
                            {abName}
                          </span>
                          <svg className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="text-gray-700 dark:text-gray-200 leading-snug text-sm">{abDesc ?? '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Alternate Forms */}
          {data.forms.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xs font-semibold text-gray-400 mb-3 font-mono">
                {t('pokemon.detail.forms')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.forms.map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    basePokemon={pokemon}
                    onClick={() => (form as any).nameLower && router.push(`/pokemon/${(form as any).nameLower}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moves */}
          {data.moves.length > 0 && (() => {
            const moveTypes = Array.from(new Set(data.moves.map(m => m.type))).sort();
            const moveCategories: string[] = ['physical', 'special', 'status'];
            const filteredMoves = data.moves.filter(m =>
              (!moveTypeFilter || m.type === moveTypeFilter) &&
              (!moveCategoryFilter || m.category === moveCategoryFilter)
            );
            const categoryColors: Record<string, string> = {
              physical: '#ef4444',
              special:  '#818cf8',
              status:   '#9ca3af',
            };
            return (
              <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <h2 className="text-xs font-semibold text-gray-400 font-mono">
                    {t('pokemon.detail.moves')}
                  </h2>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full text-gray-500" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {filteredMoves.length}{moveTypeFilter || moveCategoryFilter ? `/${data.moves.length}` : ''}
                  </span>
                </div>

                {/* Filters */}
                <div className="px-4 py-3 flex flex-col gap-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 font-mono w-20 shrink-0">{t('pokemon.type')}</span>
                    {moveTypes.map(type => {
                      const color = getTypeHex(type);
                      const active = moveTypeFilter === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setMoveTypeFilter(active ? null : type)}
                          className="transition-all duration-150 rounded-full"
                          style={{
                            outline: active ? `2px solid ${color}` : '2px solid transparent',
                            outlineOffset: '2px',
                            opacity: !moveTypeFilter || active ? 1 : 0.45,
                          }}
                        >
                          <TypeIcon type={type} size="sm" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 font-mono w-20 shrink-0">{t('pokemon.detail.category')}</span>
                    {moveCategories.map(cat => {
                      const color = categoryColors[cat];
                      const active = moveCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setMoveCategoryFilter(active ? null : cat)}
                          className="px-3 py-1 rounded-full text-xs font-bold capitalize transition-all duration-150 flex items-center gap-1.5"
                          style={active
                            ? { background: 'rgba(37,99,235,0.25)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)' }
                            : { background: `${color}18`, color, border: '1px solid transparent', opacity: !moveCategoryFilter ? 1 : 0.45 }
                          }
                        >
                          <MoveCategoryIcon category={cat as MoveCategory} />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display options */}
                <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-xs font-semibold text-gray-400 font-mono">{t('pokemon.detail.display')}</span>
                  <button
                    onClick={() => setShowMoveEffects(v => !v)}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5"
                    style={showMoveEffects
                      ? { background: 'rgba(37,99,235,0.25)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }
                    }
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    {t('moves.table.battleEffect')}
                  </button>
                </div>

                {/* Header + Rows */}
                <div className="overflow-x-auto">
                  <div className="min-w-[480px]">
                    <div className="grid px-3 py-2 text-xs font-semibold text-gray-400 font-mono"
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 3rem 3rem 3rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>{t('pokemon.detail.move')}</span>
                      <span>{t('pokemon.type')}</span>
                      <span>{t('pokemon.detail.category')}</span>
                      <span className="text-center">{t('pokemon.detail.power')}</span>
                      <span className="text-center">{t('pokemon.detail.accuracy')}</span>
                      <span className="text-center">PP</span>
                    </div>
                    <div className="space-y-1 p-1" style={{ background: 'var(--color-bg-primary)' }}>
                      {filteredMoves.length > 0 ? filteredMoves.map((move) => (
                        <MoveRow key={move.identifier} move={move} onClick={() => router.push(`/data/moves/${move.identifier}`)} showEffect={showMoveEffects} />
                      )) : (
                        <div className="px-4 py-8 text-center text-sm text-gray-600 font-mono">
                          No moves match the selected filters.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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
