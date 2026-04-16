import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon, MoveCategory } from '@/components/UI/MoveCategoryIcon';
import { PokemonSelector } from '@/components/TeamBuilder/PokemonSelector';
import { useAuth } from '@/contexts/AuthContext';
import { Pokemon, Team } from '@brianchan661/pokemon-champion-shared';
import {
  pokemonBuilderService,
  ChampionsPokemonDetail,
  ChampionsMoveEntry,
} from '@/services/pokemonBuilderService';
import { teamService } from '@/services/teamService';
import { getEffectiveness, PokeType } from '@/data/typeChart';
import { getTypeHex } from '@/utils/typeColors';

// ─── Constants ────────────────────────────────────────────────────────────────

const FIXED_LEVEL = 50;
const MAX_TEAM_SIZE = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcSpeed(base: number, sp: number, natureMod: number): number {
  const inner = Math.floor((2 * base + 31) * FIXED_LEVEL / 100);
  return Math.floor((inner + 5 + sp) * natureMod);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toLang(locale: string): 'en' | 'ja' | 'zh-CN' | 'zh-TW' {
  if (locale === 'ja') return 'ja';
  if (locale === 'zh-CN') return 'zh-CN';
  if (locale === 'zh-TW') return 'zh-TW';
  return 'en';
}

function getMoveName(move: { nameEn: string; nameJa: string | null }, lang: string): string {
  if (lang === 'ja' && move.nameJa) return move.nameJa;
  return move.nameEn;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamSlot {
  pokemon: Pokemon;
  speedSp?: number;  // only set if imported from saved team (actual EVs)
  speedNatureMod?: number;
  detail: ChampionsPokemonDetail | null;
  detailLoading: boolean;
  selectedMoves: ChampionsMoveEntry[];  // up to 4
}

interface OpponentSlot {
  pokemon: Pokemon;
  detail: ChampionsPokemonDetail | null;
  loading: boolean;
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniCard({ slot, lang, onRemove, onEditMoves }: { slot: TeamSlot; lang: string; onRemove: () => void; onEditMoves: () => void }) {
  const { t } = useTranslation('common');
  const { pokemon } = slot;
  const primaryType = pokemon.types[0]?.toLowerCase() ?? 'normal';
  const accent = getTypeHex(primaryType);

  return (
    <div
      className="flex flex-col rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg-secondary group"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      {/* Header row: sprite + name/types + remove */}
      <div className="flex items-center gap-2 p-2 pb-1.5">
        {pokemon.imageUrl && (
          <img src={pokemon.imageUrl} alt={pokemon.name} className="w-9 h-9 object-contain shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{pokemon.name}</p>
          <div className="flex gap-1 mt-0.5">
            {pokemon.types.map((ty) => <TypeIcon key={ty} type={ty} size="xs" />)}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0 p-0.5"
          aria-label={t('common.remove', 'Remove')}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Moves section */}
      <div className="px-2 pb-2">
        {slot.selectedMoves.length > 0 ? (
          <div className="space-y-0.5">
            {slot.selectedMoves.map((m) => (
              <div key={m.identifier} className="flex items-center gap-1">
                <TypeIcon type={m.type} size="xs" />
                <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{getMoveName(m, lang)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            {slot.detailLoading ? '...' : t('battleReference.noMoves', 'No moves selected')}
          </p>
        )}
        <button
          onClick={onEditMoves}
          disabled={slot.detailLoading}
          className="mt-1.5 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-40 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {slot.detailLoading ? '...' : slot.selectedMoves.length === 0 ? t('battleReference.addMoves', '+ moves') : t('battleReference.editMoves', 'Edit moves')}
        </button>
      </div>
    </div>
  );
}

function EmptySlot({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 dark:border-white/20 text-gray-400 dark:text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors text-xs"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

function StatBar({ value, max = 255, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-right text-xs font-mono text-gray-700 dark:text-gray-300 shrink-0">{value}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function OpponentDetailModal({
  slot,
  lang,
  onClose,
}: {
  slot: OpponentSlot;
  lang: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
  const { pokemon, detail } = slot;
  const primaryType = pokemon.types[0]?.toLowerCase() ?? 'normal';
  const accent = getTypeHex(primaryType);
  const [tab, setTab] = useState<'moves' | 'stats'>('moves');
  const [moveSearch, setMoveSearch] = useState('');
  const [catFilter, setCatFilter] = useState<MoveCategory | null>(null);

  const statEntries = [
    { label: 'HP',  key: 'hpBase',      color: '#4ade80' },
    { label: 'Atk', key: 'attackBase',  color: '#f87171' },
    { label: 'Def', key: 'defenseBase', color: '#fb923c' },
    { label: 'SpA', key: 'spAtkBase',   color: '#c084fc' },
    { label: 'SpD', key: 'spDefBase',   color: '#818cf8' },
    { label: 'Spe', key: 'speedBase',   color: '#fbbf24' },
  ] as const;

  const allMoves = useMemo(() => {
    if (!detail) return [];
    return detail.moves.slice().sort((a, b) => {
      if (a.category !== b.category) {
        const order = { physical: 0, special: 1, status: 2 };
        return (order[a.category as keyof typeof order] ?? 3) - (order[b.category as keyof typeof order] ?? 3);
      }
      return (b.power ?? 0) - (a.power ?? 0);
    });
  }, [detail]);

  const filteredMoves = useMemo(() => {
    let res = allMoves;
    if (catFilter) res = res.filter((m) => m.category === catFilter);
    if (moveSearch) {
      const q = moveSearch.toLowerCase();
      res = res.filter((m) => getMoveName(m, lang).toLowerCase().includes(q) || m.type.toLowerCase().includes(q));
    }
    return res;
  }, [allMoves, catFilter, moveSearch, lang]);

  const getAbilityName = (ab: { nameEn: string; nameJa: string | null }) =>
    lang === 'ja' && ab.nameJa ? ab.nameJa : ab.nameEn;
  const getAbilityDesc = (ab: { descriptionEn: string | null; descriptionJa: string | null }) =>
    lang === 'ja' && ab.descriptionJa ? ab.descriptionJa : ab.descriptionEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center gap-4 p-4 shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)` }}
        >
          {pokemon.imageUrl && (
            <img src={pokemon.imageUrl} alt={pokemon.name} className="w-16 h-16 object-contain drop-shadow shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{pokemon.name}</h3>
            <div className="flex gap-1 mt-1">
              {pokemon.types.map((ty) => <TypeIcon key={ty} type={ty} size="sm" />)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 shrink-0 px-4">
          {(['moves', 'stats'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === tabKey
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tabKey === 'moves' ? t('battleReference.damagingMoves', 'Moves') : t('battleReference.stats', 'Stats & Abilities')}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'stats' && (
            <div className="p-4 space-y-5">
              {/* Base stats */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
                  {t('battleReference.baseStats', 'Base Stats')}
                </p>
                <div className="space-y-1.5">
                  {statEntries.map(({ label, key, color }) => {
                    const val = (pokemon as unknown as Record<string, number>)[key] ?? 0;
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-8 text-xs text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
                        <StatBar value={val} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Abilities */}
              {detail && detail.abilities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">
                    {t('battleReference.abilities', 'Abilities')}
                  </p>
                  <div className="space-y-2">
                    {detail.abilities.map((ab) => (
                      <div key={ab.identifier} className="rounded-lg bg-gray-50 dark:bg-white/5 p-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{getAbilityName(ab)}</p>
                        {getAbilityDesc(ab) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{getAbilityDesc(ab)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'moves' && (
            <div className="flex flex-col h-full">
              {/* Filters */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 space-y-2 shrink-0">
                <input
                  type="text"
                  value={moveSearch}
                  onChange={(e) => setMoveSearch(e.target.value)}
                  placeholder={t('battleReference.searchMoves', 'Search moves...')}
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
                />
                <div className="flex gap-1.5">
                  {(['physical', 'special', 'status'] as MoveCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        catFilter === cat
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 text-primary-600 dark:text-primary-400'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/30'
                      }`}
                    >
                      <MoveCategoryIcon category={cat} size={13} />
                      {t(`moves.categories.${cat}`, cat)}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 self-center">
                    {filteredMoves.length}
                  </span>
                </div>
              </div>

              {/* Move list */}
              <div className="flex-1 overflow-y-auto">
                {/* Column headers */}
                <div className="sticky top-0 bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-100 dark:border-white/5 px-4 py-1.5 grid gap-2 text-xs font-medium text-gray-400 dark:text-gray-500"
                  style={{ gridTemplateColumns: '1fr 3rem 3.5rem 2.5rem 2.5rem' }}
                >
                  <span>{t('battleReference.moveName', 'Move')}</span>
                  <span className="text-right">Pwr</span>
                  <span className="text-right">Acc</span>
                  <span className="text-right">PP</span>
                  <span></span>
                </div>
                {filteredMoves.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">{t('battleReference.noMoves', 'No moves found.')}</p>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-white/5">
                    {filteredMoves.map((move) => (
                      <div
                        key={move.identifier}
                        className="px-4 py-2 grid gap-2 items-center hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
                        style={{ gridTemplateColumns: '1fr 3rem 3.5rem 2.5rem 2.5rem' }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TypeIcon type={move.type} size="xs" />
                          <MoveCategoryIcon category={move.category as MoveCategory} size={13} />
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{getMoveName(move, lang)}</span>
                        </div>
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400 text-right tabular-nums">{move.power ?? '—'}</span>
                        <span className="text-sm font-mono text-gray-400 text-right tabular-nums">{move.accuracy ? `${move.accuracy}%` : '—'}</span>
                        <span className="text-sm font-mono text-gray-400 text-right tabular-nums">{move.pp ?? '—'}</span>
                        <div className="flex justify-end">
                          {move.effectPct && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">{move.effectPct}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OpponentCard({ slot, lang, onOpenDetail }: { slot: OpponentSlot; lang: string; onOpenDetail: () => void }) {
  const { t } = useTranslation('common');
  const { pokemon, detail, loading } = slot;
  const primaryType = pokemon.types[0]?.toLowerCase() ?? 'normal';
  const accent = getTypeHex(primaryType);

  const statEntries = [
    { label: 'HP',  value: pokemon.hpBase ?? 0,     color: '#4ade80' },
    { label: 'Atk', value: pokemon.attackBase ?? 0,  color: '#f87171' },
    { label: 'Def', value: pokemon.defenseBase ?? 0, color: '#fb923c' },
    { label: 'SpA', value: pokemon.spAtkBase ?? 0,   color: '#c084fc' },
    { label: 'SpD', value: pokemon.spDefBase ?? 0,   color: '#818cf8' },
    { label: 'Spe', value: pokemon.speedBase ?? 0,   color: '#fbbf24' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg-secondary overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3" style={{ background: `linear-gradient(135deg, ${accent}18, transparent)` }}>
        {pokemon.imageUrl && (
          <img src={pokemon.imageUrl} alt={pokemon.name} className="w-14 h-14 object-contain drop-shadow shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white truncate">{pokemon.name}</p>
          <div className="flex gap-1 mt-1">
            {pokemon.types.map((ty) => <TypeIcon key={ty} type={ty} size="sm" />)}
          </div>
          {detail && (
            <div className="flex flex-wrap gap-x-2 mt-1">
              {detail.abilities.slice(0, 2).map((ab) => (
                <span key={ab.identifier} className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'ja' && ab.nameJa ? ab.nameJa : ab.nameEn}
                </span>
              ))}
            </div>
          )}
        </div>
        {loading && (
          <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {/* Base stats */}
      <div className="px-3 py-2 space-y-0.5">
        {statEntries.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-6 text-xs text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
            <StatBar value={value} color={color} />
          </div>
        ))}
      </div>

      {/* Detail button */}
      {detail && (
        <div className="border-t border-gray-100 dark:border-white/5 px-3 py-2">
          <button
            onClick={onOpenDetail}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t('battleReference.viewDetail', 'View all moves & stats')}
          </button>
        </div>
      )}
    </div>
  );
}

function effectivenessLabel(val: number): string {
  if (val === 0) return '✕';
  if (val === 0.25) return '¼';
  if (val === 0.5) return '½';
  if (val === 1) return '1×';
  if (val === 2) return '2×';
  if (val === 4) return '4×';
  return `${val}×`;
}

function effectivenessClass(val: number): string {
  if (val === 0) return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500';
  if (val <= 0.5) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (val === 1) return 'text-gray-600 dark:text-gray-400';
  if (val === 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold';
}

function ThreatTable({
  myTeam,
  opponents,
}: {
  myTeam: TeamSlot[];
  opponents: OpponentSlot[];
}) {
  const { t } = useTranslation('common');
  const filledOpponents = opponents.filter((o) => o.detail);

  if (myTeam.length === 0 || filledOpponents.length === 0) return null;

  // For each (my pokemon, opponent), find worst-case effectiveness across all opponent damaging moves
  const rows = myTeam.map((slot) => {
    const myTypes = slot.pokemon.types;
    const def1 = capitalize(myTypes[0] ?? 'Normal') as PokeType;
    const def2 = myTypes[1] ? capitalize(myTypes[1]) as PokeType : undefined;

    const cells = filledOpponents.map((opp) => {
      const moves = opp.detail!.moves.filter((m) => m.category !== 'status' && m.power !== null);
      let worst = 0;
      const worstTypes: string[] = [];
      for (const move of moves) {
        const atk = capitalize(move.type) as PokeType;
        const eff = getEffectiveness(atk, def1, def2);
        if (eff > worst) {
          worst = eff;
          worstTypes.length = 0;
          worstTypes.push(move.type);
        } else if (eff === worst && eff > 0 && !worstTypes.includes(move.type)) {
          worstTypes.push(move.type);
        }
      }
      return { val: worst, types: worstTypes };
    });

    const safeCount = cells.filter((c) => c.val <= 1).length;
    return { slot, cells, safeCount };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left pb-2 pr-3 text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
              {t('battleReference.myTeam', 'My Team')}
            </th>
            {filledOpponents.map((opp) => (
              <th key={opp.pokemon.id} className="pb-2 px-1 text-center align-bottom">
                {opp.pokemon.imageUrl && (
                  <img src={opp.pokemon.imageUrl} alt={opp.pokemon.name} className="w-8 h-8 object-contain mx-auto" />
                )}
              </th>
            ))}
            <th className="pb-2 pl-2 text-center text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap align-bottom">
              {t('battleReference.safety', 'Safety')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ slot, cells, safeCount }) => (
            <tr key={slot.pokemon.id} className="border-t border-gray-100 dark:border-white/5">
              <td className="py-1.5 pr-3">
                <div className="flex items-center gap-1.5">
                  {slot.pokemon.imageUrl && (
                    <img src={slot.pokemon.imageUrl} alt={slot.pokemon.name} className="w-6 h-6 object-contain shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{slot.pokemon.name}</span>
                </div>
              </td>
              {cells.map(({ val, types }, i) => (
                <td key={i} className="py-1.5 px-1 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-sm font-mono ${effectivenessClass(val)}`}>
                    {effectivenessLabel(val)}
                  </span>
                  {val > 1 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                      {types.map((type) => (
                        <TypeIcon key={type} type={capitalize(type) as PokeType} size="xs" />
                      ))}
                    </div>
                  )}
                </td>
              ))}
              <td className="py-1.5 pl-2 text-center">
                <span className={`text-sm font-bold ${safeCount === filledOpponents.length ? 'text-green-600 dark:text-green-400' : safeCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>
                  {safeCount}/{filledOpponents.length}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type SpeedScenario = 'lowered' | 'noSp' | 'maxSp' | 'boosted' | 'actual';

function SpeedTable({
  myTeam,
  opponents,
}: {
  myTeam: TeamSlot[];
  opponents: OpponentSlot[];
}) {
  const { t } = useTranslation('common');
  const filledOpponents = opponents.filter((o) => o.detail);
  const hasActual = myTeam.some((s) => s.speedSp !== undefined);

  type Row = {
    id: string;
    pokemon: Pokemon;
    side: 'mine' | 'opp';
    base: number;
    lowered: number;
    noSp: number;
    maxSp: number;
    boosted: number;
    actual?: number;
  };

  const rows: Row[] = [
    ...myTeam.map((slot) => {
      const base = slot.pokemon.speedBase ?? 0;
      return {
        id: `mine-${slot.pokemon.id}`,
        pokemon: slot.pokemon,
        side: 'mine' as const,
        base,
        lowered: calcSpeed(base, 0, 0.9),
        noSp: calcSpeed(base, 0, 1.0),
        maxSp: calcSpeed(base, 32, 1.0),
        boosted: calcSpeed(base, 32, 1.1),
        actual: slot.speedSp !== undefined
          ? calcSpeed(base, slot.speedSp, slot.speedNatureMod ?? 1.0)
          : undefined,
      };
    }),
    ...filledOpponents.map((slot) => {
      const base = slot.pokemon.speedBase ?? 0;
      return {
        id: `opp-${slot.pokemon.id}`,
        pokemon: slot.pokemon,
        side: 'opp' as const,
        base,
        lowered: calcSpeed(base, 0, 0.9),
        noSp: calcSpeed(base, 0, 1.0),
        maxSp: calcSpeed(base, 32, 1.0),
        boosted: calcSpeed(base, 32, 1.1),
      };
    }),
  ];

  // Per-pokemon scenario selection
  const [scenarios, setScenarios] = useState<Record<string, SpeedScenario>>({});
  const getScenario = (row: Row): SpeedScenario => scenarios[row.id] ?? 'maxSp';
  const setScenario = (id: string, val: SpeedScenario) =>
    setScenarios((prev) => ({ ...prev, [id]: val }));

  const scenarioBtns: { value: SpeedScenario; label: string }[] = [
    { value: 'lowered', label: t('pokemon.detail.statColLowered', 'Lowered') },
    { value: 'noSp',    label: t('pokemon.detail.statColNoSP', '0 SP') },
    { value: 'maxSp',   label: t('pokemon.detail.statColMaxSP', '32 SP') },
    { value: 'boosted', label: t('pokemon.detail.statColBoosted', 'Boosted') },
    ...(hasActual ? [{ value: 'actual' as SpeedScenario, label: t('battleReference.actual', 'Actual') }] : []),
  ];

  // Speed order panel: sorted descending by each pokemon's selected scenario
  const speedOrder = [...rows].sort((a, b) => {
    const aVal = (a[getScenario(a)] ?? a.maxSp) as number;
    const bVal = (b[getScenario(b)] ?? b.maxSp) as number;
    return bVal - aVal;
  });

  if (myTeam.length === 0 && filledOpponents.length === 0) return null;

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left: stat table with per-row scenario buttons */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm border-collapse font-mono">
          <thead>
            <tr>
              <th className="text-left pb-2 pr-3 text-xs text-gray-500 dark:text-gray-400 font-medium font-sans">
                {t('battleReference.pokemon', 'Pokemon')}
              </th>
              <th className="pb-2 pr-4 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t('pokemon.detail.statColBase', 'Base')}
              </th>
              <th className="pb-2 px-1 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t('pokemon.detail.statColLowered', 'Lowered')}
              </th>
              <th className="pb-2 px-1 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t('pokemon.detail.statColNoSP', '0 SP')}
              </th>
              <th className="pb-2 px-1 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t('pokemon.detail.statColMaxSP', '32 SP')}
              </th>
              <th className="pb-2 px-1 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t('pokemon.detail.statColBoosted', 'Boosted')}
              </th>
              {hasActual && (
                <th className="pb-2 px-1 text-right text-xs text-amber-500 dark:text-amber-400 font-medium">
                  {t('battleReference.actual', 'Actual')}
                </th>
              )}
              <th className="pb-2 pl-3 text-xs text-gray-500 dark:text-gray-400 font-medium font-sans whitespace-nowrap">
                {t('battleReference.scenario', 'Scenario')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMine = row.side === 'mine';
              const scenario = getScenario(row);
              return (
                <tr
                  key={row.id}
                  className={`border-t border-gray-100 dark:border-white/5 ${
                    isMine ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'bg-red-50/40 dark:bg-red-900/10'
                  }`}
                >
                  <td className="py-1.5 pr-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold px-1 rounded ${isMine ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                        {isMine ? 'MY' : 'OPP'}
                      </span>
                      {row.pokemon.imageUrl && (
                        <img src={row.pokemon.imageUrl} alt={row.pokemon.name} className="w-5 h-5 object-contain shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{row.pokemon.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-4 text-right text-gray-600 dark:text-gray-400">{row.base}</td>
                  {(['lowered', 'noSp', 'maxSp', 'boosted'] as SpeedScenario[]).map((key) => (
                    <td key={key} className={`py-1.5 px-1 text-right tabular-nums ${scenario === key ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                      {row[key]}
                    </td>
                  ))}
                  {hasActual && (
                    <td className={`py-1.5 px-1 text-right tabular-nums ${scenario === 'actual' ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-amber-500/60 dark:text-amber-500/40'}`}>
                      {row.actual ?? '—'}
                    </td>
                  )}
                  {/* Scenario selector buttons */}
                  <td className="py-1 pl-3">
                    <div className="flex gap-0.5">
                      {scenarioBtns.map((btn) => (
                        <button
                          key={btn.value}
                          onClick={() => setScenario(row.id, btn.value)}
                          className={`text-sm px-1.5 py-0.5 rounded font-medium transition-colors ${
                            scenario === btn.value
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right: speed order panel */}
      <div className="xl:w-64 shrink-0 border-l-[3px] border-gray-300 dark:border-white/40 pl-4">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
          {t('battleReference.speedOrder', 'Speed Order')}
        </p>
        <div className="space-y-1">
          {speedOrder.map((row, i) => {
            const isMine = row.side === 'mine';
            const scenario = getScenario(row);
            const speed = (row[scenario] ?? row.maxSp) as number;
            return (
              <div
                key={row.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                  isMine ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-red-50 dark:bg-red-900/10'
                }`}
              >
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4 shrink-0 tabular-nums text-right">{i + 1}</span>
                {row.pokemon.imageUrl && (
                  <img src={row.pokemon.imageUrl} alt={row.pokemon.name} className="w-5 h-5 object-contain shrink-0" />
                )}
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">{row.pokemon.name}</span>
                <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-200 shrink-0 tabular-nums">{speed}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MOVE_CATEGORIES_PICKER: MoveCategory[] = ['physical', 'special', 'status'];

function MovePicker({
  slot,
  onClose,
  onToggleMove,
  lang,
}: {
  slot: TeamSlot;
  onClose: () => void;
  onToggleMove: (pokemonId: number, move: ChampionsMoveEntry) => void;
  lang: string;
}) {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [catFilters, setCatFilters] = useState<MoveCategory[]>([]);

  const availableTypes = useMemo(() => {
    if (!slot.detail) return [];
    const types = new Set(
      slot.detail.moves
        .map((m) => m.type.toLowerCase())
    );
    return Array.from(types).sort();
  }, [slot.detail]);

  const allDamaging = useMemo(() => {
    if (!slot.detail) return [];
    return slot.detail.moves
      .slice()
      .sort((a, b) => {
        const typeCmp = a.type.localeCompare(b.type);
        if (typeCmp !== 0) return typeCmp;
        return (b.power ?? 0) - (a.power ?? 0);
      });
  }, [slot.detail]);

  const filtered = useMemo(() => {
    let result = allDamaging;
    if (typeFilters.length > 0)
      result = result.filter((m) => typeFilters.includes(m.type.toLowerCase()));
    if (catFilters.length > 0)
      result = result.filter((m) => catFilters.includes(m.category as MoveCategory));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => getMoveName(m, lang).toLowerCase().includes(q) || m.type.toLowerCase().includes(q));
    }
    return result;
  }, [allDamaging, typeFilters, catFilters, search]);

  const toggleType = (type: string) =>
    setTypeFilters((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  const toggleCat = (cat: MoveCategory) =>
    setCatFilters((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const isSelected = (m: ChampionsMoveEntry) =>
    slot.selectedMoves.some((s) => s.identifier === m.identifier);
  const isFull = slot.selectedMoves.length >= 4;
  const hasFilter = search || typeFilters.length > 0 || catFilters.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {slot.pokemon.name}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t('battleReference.selectMoves', 'Select up to 4 moves')} ({slot.selectedMoves.length}/4)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected moves preview */}
        {slot.selectedMoves.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-white/5">
            {slot.selectedMoves.map((m) => (
              <button
                key={m.identifier}
                onClick={() => onToggleMove(slot.pokemon.id, m)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <TypeIcon type={m.type} size="xs" />
                {getMoveName(m, lang)}
                <span className="ml-0.5 opacity-60">×</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="px-4 py-3 space-y-2 border-b border-gray-100 dark:border-white/5">
          {/* Search + clear */}
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('battleReference.searchMoves', 'Search moves...')}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
            />
            {hasFilter && (
              <button
                onClick={() => { setSearch(''); setTypeFilters([]); setCatFilters([]); }}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 whitespace-nowrap"
              >
                {t('moves.clearFilters', 'Clear')}
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5">
            {MOVE_CATEGORIES_PICKER.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  catFilters.includes(cat)
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 text-primary-600 dark:text-primary-400'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/30'
                }`}
              >
                <MoveCategoryIcon category={cat} size={14} />
                {t(`moves.categories.${cat}`, cat)}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1">
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`transition-all rounded-full p-0.5 ${
                  typeFilters.includes(type)
                    ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-dark-bg-secondary'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <TypeIcon type={type} size="xs" />
              </button>
            ))}
          </div>
        </div>

        {/* Move list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {slot.detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('battleReference.noMoves', 'No moves found.')}</p>
          ) : (
            filtered.map((move) => {
              const selected = isSelected(move);
              const disabled = !selected && isFull;
              return (
                <button
                  key={move.identifier}
                  onClick={() => !disabled && onToggleMove(slot.pokemon.id, move)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    selected
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <TypeIcon type={move.type} size="xs" />
                  <MoveCategoryIcon category={move.category as MoveCategory} size={14} />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{getMoveName(move, lang)}</span>
                  <span className="text-xs font-mono text-gray-500 shrink-0 w-6 text-right">{move.power ?? '—'}</span>
                  <span className="text-xs font-mono text-gray-400 shrink-0 w-8 text-right">{move.accuracy ? `${move.accuracy}%` : '—'}</span>
                  <span className="text-xs font-mono text-gray-400 shrink-0 w-5 text-right">{move.pp ?? '—'}</span>
                  {selected && (
                    <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MoveAnalysisTable({
  myTeam,
  opponents,
  lang,
}: {
  myTeam: TeamSlot[];
  opponents: OpponentSlot[];
  lang: string;
}) {
  const { t } = useTranslation('common');
  const [filterPokemonId, setFilterPokemonId] = useState<number | null>(null);
  const filledOpponents = opponents.filter((o) => o.detail);
  const slotsWithMoves = myTeam.filter((s) => s.selectedMoves.length > 0);

  if (slotsWithMoves.length === 0 || filledOpponents.length === 0) return null;

  // Each row = one move from one of my Pokemon
  type MoveRow = {
    pokemon: Pokemon;
    move: ChampionsMoveEntry;
    cells: number[]; // effectiveness against each opponent
  };

  const allRows: MoveRow[] = slotsWithMoves.flatMap((slot) =>
    slot.selectedMoves.map((move) => {
      const atk = capitalize(move.type) as PokeType;
      const cells = filledOpponents.map((opp) => {
        const oppTypes = opp.pokemon.types;
        const def1 = capitalize(oppTypes[0] ?? 'Normal') as PokeType;
        const def2 = oppTypes[1] ? capitalize(oppTypes[1]) as PokeType : undefined;
        return getEffectiveness(atk, def1, def2);
      });
      return { pokemon: slot.pokemon, move, cells };
    })
  );

  const rows = filterPokemonId === null
    ? allRows
    : allRows.filter((r) => r.pokemon.id === filterPokemonId);

  const showFilter = slotsWithMoves.length > 1;

  return (
    <div className="space-y-3">
      {/* Pokemon filter chips */}
      {showFilter && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => setFilterPokemonId(null)}
            className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
              filterPokemonId === null
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/30'
            }`}
          >
            {t('battleReference.allPokemon', 'All')}
          </button>
          {slotsWithMoves.map((slot) => (
            <button
              key={slot.pokemon.id}
              onClick={() => setFilterPokemonId(filterPokemonId === slot.pokemon.id ? null : slot.pokemon.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-colors ${
                filterPokemonId === slot.pokemon.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'
              }`}
              title={slot.pokemon.name}
            >
              {slot.pokemon.imageUrl && (
                <img src={slot.pokemon.imageUrl} alt={slot.pokemon.name} className="w-5 h-5 object-contain" />
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">{slot.pokemon.name}</span>
            </button>
          ))}
        </div>
      )}
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left pb-2 pr-2 text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
              {t('battleReference.myMove', 'My Move')}
            </th>
            <th className="pb-2 px-2 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
              {t('pokemon.detail.power', 'Power')}
            </th>
            <th className="pb-2 px-2 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
              {t('pokemon.detail.accuracy', 'Accuracy')}
            </th>
            <th className="pb-2 px-2 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
              PP
            </th>
            {filledOpponents.map((opp) => (
              <th key={opp.pokemon.id} className="pb-2 px-1 text-center align-bottom">
                {opp.pokemon.imageUrl && (
                  <img src={opp.pokemon.imageUrl} alt={opp.pokemon.name} className="w-8 h-8 object-contain mx-auto" />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ pokemon, move, cells }, i) => (
            <tr key={`${pokemon.id}-${move.identifier}`} className={`border-t border-gray-100 dark:border-white/5 ${i > 0 && rows[i - 1].pokemon.id !== pokemon.id ? 'border-t-2 border-gray-300 dark:border-white/20' : ''}`}>
              <td className="py-1.5 pr-2">
                <div className="flex items-center gap-1.5">
                  {pokemon.imageUrl && (
                    <img src={pokemon.imageUrl} alt={pokemon.name} className="w-5 h-5 object-contain shrink-0" />
                  )}
                  <TypeIcon type={move.type} size="xs" />
                  <MoveCategoryIcon category={move.category as MoveCategory} size={12} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{getMoveName(move, lang)}</span>
                </div>
              </td>
              <td className="py-1.5 px-2 text-center text-sm font-mono text-gray-500 tabular-nums">{move.power ?? '—'}</td>
              <td className="py-1.5 px-2 text-center text-sm font-mono text-gray-500 tabular-nums">{move.accuracy ? `${move.accuracy}%` : '—'}</td>
              <td className="py-1.5 px-2 text-center text-sm font-mono text-gray-500 tabular-nums">{move.pp ?? '—'}</td>
              {cells.map((val, j) => (
                <td key={j} className="py-1.5 px-1 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-sm font-mono ${effectivenessClass(val)}`}>
                    {effectivenessLabel(val)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BattleReferencePage() {
  const { t, i18n } = useTranslation('common');
  const { isAuthenticated } = useAuth();

  // My team state
  const [myTeam, setMyTeam] = useState<TeamSlot[]>([]);
  const [showMySelector, setShowMySelector] = useState(false);
  const [movePickerPokemonId, setMovePickerPokemonId] = useState<number | null>(null);

  // Saved team import state
  const [savedTeams, setSavedTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showTeamImport, setShowTeamImport] = useState(false);

  // Opponent state
  const [opponents, setOpponents] = useState<OpponentSlot[]>([]);
  const [showOppSelector, setShowOppSelector] = useState(false);
  const [detailModalPokemonId, setDetailModalPokemonId] = useState<number | null>(null);

  const lang = toLang(i18n.language);

  // Refs to always read latest state inside the lang effect
  const myTeamRef = React.useRef(myTeam);
  const opponentsRef = React.useRef(opponents);
  React.useEffect(() => { myTeamRef.current = myTeam; }, [myTeam]);
  React.useEffect(() => { opponentsRef.current = opponents; }, [opponents]);

  // Re-fetch all details when language changes
  React.useEffect(() => {
    myTeamRef.current.forEach((slot) => {
      const nameLower = slot.pokemon.nameLower ?? slot.pokemon.name.toLowerCase().replace(/\s+/g, '-');
      setMyTeam((prev) => prev.map((s) => s.pokemon.id === slot.pokemon.id ? { ...s, detailLoading: true } : s));
      pokemonBuilderService.getPokemonBySlug(nameLower, lang).then((res) => {
        setMyTeam((prev) => prev.map((s) =>
          s.pokemon.id === slot.pokemon.id
            ? {
                ...s,
                pokemon: res.success && res.data ? { ...s.pokemon, name: res.data.base.name } : s.pokemon,
                detail: res.success && res.data ? res.data : null,
                detailLoading: false,
              }
            : s
        ));
      });
    });
    opponentsRef.current.forEach((slot) => {
      const nameLower = slot.pokemon.nameLower ?? slot.pokemon.name.toLowerCase().replace(/\s+/g, '-');
      setOpponents((prev) => prev.map((o) => o.pokemon.id === slot.pokemon.id ? { ...o, loading: true } : o));
      pokemonBuilderService.getPokemonBySlug(nameLower, lang).then((res) => {
        setOpponents((prev) => prev.map((o) =>
          o.pokemon.id === slot.pokemon.id
            ? {
                ...o,
                pokemon: res.success && res.data ? { ...o.pokemon, name: res.data.base.name } : o.pokemon,
                detail: res.success && res.data ? res.data : null,
                loading: false,
              }
            : o
        ));
      });
    });
  }, [lang]);

  // Load saved teams
  const handleLoadSavedTeams = useCallback(async () => {
    setLoadingTeams(true);
    setShowTeamImport(true);
    const res = await teamService.getMyTeams(lang);
    if (res.success && res.data) {
      setSavedTeams(res.data.teams);
    }
    setLoadingTeams(false);
  }, [lang]);

  // Import a saved team into My Team slots
  const handleImportTeam = useCallback((team: Team) => {
    const slots: TeamSlot[] = team.pokemon.slice(0, MAX_TEAM_SIZE).map((tp) => {
      if (!tp.pokemonData) return null;
      const pokemon: Pokemon = {
        id: tp.pokemonData.id,
        nationalNumber: tp.pokemonData.nationalNumber,
        name: tp.pokemonData.name,
        nameLower: tp.pokemonData.nameLower,
        types: tp.pokemonData.types,
        imageUrl: tp.pokemonData.imageUrl,
        hpMax: 0,
        attackMax: 0,
        defenseMax: 0,
        spAtkMax: 0,
        spDefMax: 0,
        speedMax: 0,
        statTotal: 0,
        ability1: tp.abilityData?.name ?? '',
      };
      // Derive speed SP and nature mod from EVs/nature
      const speedSp = tp.evs?.speed != null ? Math.floor(tp.evs.speed / 8) : undefined;
      let speedNatureMod = 1.0;
      if (tp.natureData?.increasedStat === 'speed') speedNatureMod = 1.1;
      if (tp.natureData?.decreasedStat === 'speed') speedNatureMod = 0.9;
      return { pokemon, speedSp, speedNatureMod, detail: null, detailLoading: false, selectedMoves: [] };
    }).filter(Boolean) as TeamSlot[];
    setMyTeam(slots);
    setShowTeamImport(false);
    // Fetch details for each imported slot in background
    slots.forEach(async (slot) => {
      const nameLower = slot.pokemon.nameLower ?? slot.pokemon.name.toLowerCase().replace(/\s+/g, '-');
      setMyTeam((prev) => prev.map((s) => s.pokemon.id === slot.pokemon.id ? { ...s, detailLoading: true } : s));
      const res = await pokemonBuilderService.getPokemonBySlug(nameLower, lang);
      setMyTeam((prev) => prev.map((s) =>
        s.pokemon.id === slot.pokemon.id
          ? { ...s, detail: res.success && res.data ? res.data : null, detailLoading: false }
          : s
      ));
    });
  }, [lang]);

  // Add to my team from selector
  const handleAddMyPokemon = useCallback(async (pokemon: Pokemon) => {
    if (myTeam.length >= MAX_TEAM_SIZE) return;
    if (myTeam.some((s) => s.pokemon.id === pokemon.id)) return;
    setShowMySelector(false);
    setMyTeam((prev) => [...prev, { pokemon, detail: null, detailLoading: true, selectedMoves: [] }]);
    const nameLower = pokemon.nameLower ?? pokemon.name.toLowerCase().replace(/\s+/g, '-');
    const res = await pokemonBuilderService.getPokemonBySlug(nameLower, lang);
    setMyTeam((prev) => prev.map((s) =>
      s.pokemon.id === pokemon.id
        ? { ...s, detail: res.success && res.data ? res.data : null, detailLoading: false }
        : s
    ));
  }, [myTeam, lang]);

  const handleRemoveMyPokemon = useCallback((id: number) => {
    setMyTeam((prev) => prev.filter((s) => s.pokemon.id !== id));
  }, []);

  const handleToggleMove = useCallback((pokemonId: number, move: ChampionsMoveEntry) => {
    setMyTeam((prev) => prev.map((s) => {
      if (s.pokemon.id !== pokemonId) return s;
      const already = s.selectedMoves.some((m) => m.identifier === move.identifier);
      if (already) {
        return { ...s, selectedMoves: s.selectedMoves.filter((m) => m.identifier !== move.identifier) };
      }
      if (s.selectedMoves.length >= 4) return s;
      return { ...s, selectedMoves: [...s.selectedMoves, move] };
    }));
  }, []);

  // Add opponent
  const handleAddOpponent = useCallback(async (pokemon: Pokemon) => {
    if (opponents.length >= MAX_TEAM_SIZE) return;
    if (opponents.some((o) => o.pokemon.id === pokemon.id)) return;
    setShowOppSelector(false);

    const slot: OpponentSlot = { pokemon, detail: null, loading: true };
    setOpponents((prev) => [...prev, slot]);

    const nameLower = pokemon.nameLower ?? pokemon.name.toLowerCase().replace(/\s+/g, '-');
    const res = await pokemonBuilderService.getPokemonBySlug(nameLower, lang);
    setOpponents((prev) =>
      prev.map((o) =>
        o.pokemon.id === pokemon.id
          ? { ...o, detail: res.success && res.data ? res.data : null, loading: false }
          : o
      )
    );
  }, [opponents, lang]);

  const handleRemoveOpponent = useCallback((id: number) => {
    setOpponents((prev) => prev.filter((o) => o.pokemon.id !== id));
  }, []);

  const mySelectedIds = useMemo(() => myTeam.map((s) => s.pokemon.id), [myTeam]);
  const oppSelectedIds = useMemo(() => opponents.map((o) => o.pokemon.id), [opponents]);

  return (
    <>
      <Head>
        <title>{t('battleReference.pageTitle', 'Battle Reference')} | Pokemon Champion</title>
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {t('battleReference.title', 'Battle Reference')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('battleReference.subtitle', 'Set up your team and analyze matchups against opponents.')}
          </p>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Left sidebar: My Team ── */}
            <aside className="lg:w-56 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('battleReference.myTeam', 'My Team')} ({myTeam.length}/{MAX_TEAM_SIZE})
                </h2>
              </div>

              {/* Import from saved team */}
              {isAuthenticated && (
                <button
                  onClick={handleLoadSavedTeams}
                  className="w-full text-xs text-primary-600 dark:text-primary-400 hover:underline text-left flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('battleReference.importTeam', 'Import from Saved Team')}
                </button>
              )}

              {/* Team import dropdown */}
              {showTeamImport && (
                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg-secondary p-2 space-y-1 max-h-48 overflow-y-auto">
                  {loadingTeams ? (
                    <div className="flex justify-center py-2">
                      <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : savedTeams.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">{t('battleReference.noTeams', 'No saved teams found.')}</p>
                  ) : (
                    savedTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleImportTeam(team)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-700 dark:text-gray-300"
                      >
                        {team.name}
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setShowTeamImport(false)}
                    className="w-full text-center text-xs text-gray-400 hover:text-gray-600 pt-1"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                </div>
              )}

              {/* Team slots */}
              <div className="space-y-1.5">
                {myTeam.map((slot) => (
                  <MiniCard
                    key={slot.pokemon.id}
                    slot={slot}
                    lang={lang}
                    onRemove={() => handleRemoveMyPokemon(slot.pokemon.id)}
                    onEditMoves={() => setMovePickerPokemonId(slot.pokemon.id)}
                  />
                ))}
                {myTeam.length < MAX_TEAM_SIZE && (
                  <EmptySlot
                    label={t('battleReference.addPokemon', 'Add Pokemon')}
                    onClick={() => setShowMySelector(true)}
                  />
                )}
              </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 space-y-8 min-w-0">
              {/* Opponent Cards */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {t('battleReference.opponents', 'Opponents')} ({opponents.length}/{MAX_TEAM_SIZE})
                  </h2>
                  {opponents.length < MAX_TEAM_SIZE && (
                    <button
                      onClick={() => setShowOppSelector(true)}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('battleReference.addOpponent', 'Add Opponent')}
                    </button>
                  )}
                </div>

                {opponents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                    <p className="text-sm">{t('battleReference.noOpponents', 'Add an opponent Pokemon to get started.')}</p>
                    <button
                      onClick={() => setShowOppSelector(true)}
                      className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {t('battleReference.addOpponent', 'Add Opponent')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {opponents.map((slot) => (
                      <div key={slot.pokemon.id} className="relative">
                        <button
                          onClick={() => handleRemoveOpponent(slot.pokemon.id)}
                          className="absolute top-2 right-2 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-dark-bg-tertiary text-gray-400 hover:text-red-500 shadow transition-colors"
                          aria-label={t('battleReference.removeOpponent', 'Remove opponent')}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <OpponentCard
                          slot={slot}
                          lang={lang}
                          onOpenDetail={() => setDetailModalPokemonId(slot.pokemon.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Move Analysis Table */}
              {myTeam.some((s) => s.selectedMoves.length > 0) && opponents.some((o) => o.detail) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    {t('battleReference.moveAnalysis', 'Move Analysis')}
                    <span title={t('battleReference.moveAnalysisHelp', 'Type effectiveness of your selected moves against each opponent. Select moves from your team in the sidebar.')} className="cursor-help text-xs font-bold leading-none w-3.5 h-3.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 inline-flex items-center justify-center flex-shrink-0">?</span>
                  </h2>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg-secondary p-4">
                    <MoveAnalysisTable myTeam={myTeam} opponents={opponents} lang={lang} />
                  </div>
                </section>
              )}

              {/* Threat Analysis Table */}
              {myTeam.length > 0 && opponents.some((o) => o.detail) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    {t('battleReference.threatAnalysis', 'Threat Analysis')}
                    <span title={t('battleReference.threatAnalysisHelp', 'Worst-case type effectiveness of any damaging move each opponent can learn against your team. Higher safety score means fewer opponents threaten you.')} className="cursor-help text-xs font-bold leading-none w-3.5 h-3.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 inline-flex items-center justify-center flex-shrink-0">?</span>
                  </h2>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg-secondary p-4">
                    <ThreatTable myTeam={myTeam} opponents={opponents} />
                  </div>
                </section>
              )}

              {/* Speed Comparison Table */}
              {(myTeam.length > 0 || opponents.some((o) => o.detail)) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    {t('battleReference.speedComparison', 'Speed Comparison')}
                    <span title={t('battleReference.speedComparisonHelp', 'Calculated Speed stats. Lowered = 0 SP, ×0.9 nature. Boosted = 32 SP, ×1.1 nature.')} className="cursor-help text-xs font-bold leading-none w-3.5 h-3.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 inline-flex items-center justify-center flex-shrink-0">?</span>
                  </h2>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-bg-secondary p-4">
                    <SpeedTable
                      myTeam={myTeam}
                      opponents={opponents}
                    />
                  </div>
                </section>
              )}
            </main>
          </div>
        </div>

        {/* Opponent detail modal */}
        {detailModalPokemonId !== null && (() => {
          const slot = opponents.find((o) => o.pokemon.id === detailModalPokemonId);
          return slot ? (
            <OpponentDetailModal
              slot={slot}
              lang={lang}
              onClose={() => setDetailModalPokemonId(null)}
            />
          ) : null;
        })()}

        {/* Move picker modal */}
        {movePickerPokemonId !== null && (() => {
          const slot = myTeam.find((s) => s.pokemon.id === movePickerPokemonId);
          return slot ? (
            <MovePicker
              slot={slot}
              lang={lang}
              onClose={() => setMovePickerPokemonId(null)}
              onToggleMove={handleToggleMove}
            />
          ) : null;
        })()}

        {/* My team Pokemon selector modal */}
        {showMySelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('battleReference.selectMyPokemon', 'Select your Pokemon')}
                </h3>
                <button onClick={() => setShowMySelector(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <PokemonSelector
                  onSelect={handleAddMyPokemon}
                  selectedPokemonIds={mySelectedIds}
                />
              </div>
            </div>
          </div>
        )}

        {/* Opponent Pokemon selector modal */}
        {showOppSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('battleReference.selectOpponent', 'Select opponent Pokemon')}
                </h3>
                <button onClick={() => setShowOppSelector(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <PokemonSelector
                  onSelect={handleAddOpponent}
                  selectedPokemonIds={oppSelectedIds}
                />
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
