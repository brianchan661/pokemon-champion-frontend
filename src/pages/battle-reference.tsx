import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon, MoveCategory } from '@/components/UI/MoveCategoryIcon';
import { PokemonSelector } from '@/components/TeamBuilder/PokemonSelector';
import { MovePicker } from '@/components/TeamBuilder/MovePicker';
import { useAuth } from '@/contexts/AuthContext';
import { Pokemon, Team, StatSpread } from '@brianchan661/pokemon-champion-shared';
import {
  pokemonBuilderService,
  ChampionsPokemonDetail,
  ChampionsMoveEntry,
  ChampionsAbilityDetail,
} from '@/services/pokemonBuilderService';
import { teamService } from '@/services/teamService';
import { naturesService, Nature } from '@/services/naturesService';
import { itemsService, Item } from '@/services/itemsService';
import { NaturePickerModal } from '@/components/TeamBuilder/NaturePickerModal';
import { getEffectiveness, PokeType, TYPES } from '@/data/typeChart';
import { getTypeHex } from '@/utils/typeColors';
import { calculateStat, calculateHP } from '@/utils/calculateStats';

// ─── Constants ────────────────────────────────────────────────────────────────

const FIXED_LEVEL = 50;
const MAX_TEAM_SIZE = 6;

const DEFAULT_EVS: StatSpread = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
const DEFAULT_NATURE_MODS = { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 };

const STAT_ROWS = [
  { key: 'hp'            as keyof StatSpread, label: 'HP',  baseKey: 'hpBase'      as keyof Pokemon, color: '#4ade80' },
  { key: 'attack'        as keyof StatSpread, label: 'Atk', baseKey: 'attackBase'  as keyof Pokemon, color: '#f87171' },
  { key: 'defense'       as keyof StatSpread, label: 'Def', baseKey: 'defenseBase' as keyof Pokemon, color: '#fb923c' },
  { key: 'specialAttack' as keyof StatSpread, label: 'SpA', baseKey: 'spAtkBase'   as keyof Pokemon, color: '#c084fc' },
  { key: 'specialDefense'as keyof StatSpread, label: 'SpD', baseKey: 'spDefBase'   as keyof Pokemon, color: '#818cf8' },
  { key: 'speed'         as keyof StatSpread, label: 'Spe', baseKey: 'speedBase'   as keyof Pokemon, color: '#fbbf24' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcSpeed(base: number, sp: number, natureMod: number): number {
  const inner = Math.floor((2 * base + 31) * FIXED_LEVEL / 100);
  return Math.floor((inner + 5 + sp) * natureMod);
}


function natureModsFromData(increasedStat?: string, decreasedStat?: string) {
  const mods = { ...DEFAULT_NATURE_MODS };
  const map: Record<string, keyof typeof mods> = {
    attack: 'attack', defense: 'defense', sp_atk: 'specialAttack',
    sp_def: 'specialDefense', speed: 'speed',
  };
  if (increasedStat && map[increasedStat]) mods[map[increasedStat]] = 1.1;
  if (decreasedStat && map[decreasedStat]) mods[map[decreasedStat]] = 0.9;
  return mods;
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
  if (lang.startsWith('ja') && move.nameJa) return move.nameJa;
  return move.nameEn;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamSlot {
  pokemon: Pokemon;
  evs: StatSpread;
  natureMods: typeof DEFAULT_NATURE_MODS;
  item?: { name: string; spriteUrl?: string };
  natureName?: string;
  selectedAbilityIdentifier?: string;
  detail: ChampionsPokemonDetail | null;
  detailLoading: boolean;
  selectedMoves: ChampionsMoveEntry[];
}

interface OpponentSlot {
  pokemon: Pokemon;
  evs: StatSpread;
  natureMods: typeof DEFAULT_NATURE_MODS;
  item?: { name: string; spriteUrl?: string };
  natureName?: string;
  selectedAbilityIdentifier?: string;
  detail: ChampionsPokemonDetail | null;
  loading: boolean;
}


// ─── Sub-components ───────────────────────────────────────────────────────────

type NatureMods = typeof DEFAULT_NATURE_MODS;

function AbilityPickerModal({ abilities, selectedIdentifier, lang, onSelect, onClose }: {
  abilities: ChampionsAbilityDetail[];
  selectedIdentifier: string;
  lang: string;
  onSelect: (identifier: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary">
          <span className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">{t('battleReference.ability', 'Ability')}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="p-3 space-y-2">
          {abilities.map((ab) => {
            const isSelected = ab.identifier === selectedIdentifier;
            const name = lang === 'ja' && ab.nameJa ? ab.nameJa : ab.nameEn;
            const desc = lang === 'ja' && ab.descriptionJa ? ab.descriptionJa : ab.descriptionEn;
            return (
              <button
                key={ab.identifier}
                onClick={() => { onSelect(ab.identifier); onClose(); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }`}
              >
                <p className="text-sm font-semibold leading-tight">{name}</p>
                {desc && <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{desc}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function ItemPickerModal({ lang, selectedItem, onSelect, onClear, onClose }: {
  lang: string;
  selectedItem?: { name: string; spriteUrl?: string };
  onSelect: (item: Item) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all items once on mount
  React.useEffect(() => {
    itemsService.getItems({ lang: lang as 'en' | 'ja' }).then((res) => {
      if (res.success && res.data) setAllItems(res.data);
      setLoading(false);
    });
  }, [lang]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allItems.map((i) => i.category))).sort();
    return cats;
  }, [allItems]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (category) items = items.filter((i) => i.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, category, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-md flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">Item</span>
            {selectedItem && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                {selectedItem.spriteUrl && <img src={selectedItem.spriteUrl} className="w-4 h-4 object-contain" alt="" />}
                <span className="text-xs font-semibold">{selectedItem.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Search + category filters */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-dark-border shrink-0 space-y-2">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('battleReference.searchItems', 'Search items...')}
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setCategory('')}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${!category ? 'bg-primary-600/20 border-primary-500/50 text-primary-400' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
            >
              {t('battleReference.allCategories', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors capitalize ${category === cat ? 'bg-primary-600/20 border-primary-500/50 text-primary-400' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}
              >
                {cat.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {selectedItem && (
            <button
              onClick={() => { onClear(); onClose(); }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors border-b border-gray-100 dark:border-white/5"
            >
              {t('battleReference.removeItem', 'Remove item')}
            </button>
          )}
          {loading && <p className="text-xs text-gray-300 text-center py-6">{t('battleReference.loadingItems', 'Loading...')}</p>}
          {!loading && filtered.length === 0 && <p className="text-xs text-gray-300 text-center py-6">{t('battleReference.noItemsFound', 'No items found.')}</p>}
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                {item.spriteUrl
                  ? <img src={item.spriteUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                  : <div className="w-8 h-8 rounded bg-gray-100 dark:bg-white/10 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{item.name}</p>
                  {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2">{item.description}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatEvRow({
  label, color, base, ev, natureMod, onChangeEv,
}: {
  label: string; color: string; base: number; ev: number; natureMod: number; onChangeEv: (v: number) => void;
}) {
  const isHp = label === 'HP';
  const calc = isHp ? calculateHP(base, ev) : calculateStat(base, ev, natureMod);
  const arrow = natureMod > 1 ? '▲' : natureMod < 1 ? '▼' : null;
  const valColor = arrow ? (natureMod > 1 ? '#4ade80' : '#f87171') : 'var(--color-text-primary)';
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-7 text-[10px] font-bold shrink-0 text-right" style={{ color }}>{label}</span>
      <button onClick={() => onChangeEv(0)} className={`text-[9px] w-5 py-0.5 rounded border transition-colors ${ev === 0 ? 'bg-white/15 border-white/25 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>0</button>
      <button onClick={() => onChangeEv(32)} className={`text-[9px] w-7 py-0.5 rounded border transition-colors ${ev === 32 ? 'bg-white/15 border-white/25 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}>32</button>
      <input
        type="number" min={0} max={32} value={ev}
        onChange={(e) => onChangeEv(Math.min(32, Math.max(0, parseInt(e.target.value) || 0)))}
        className="w-9 text-[10px] text-center bg-white/5 border border-white/10 rounded px-0.5 py-0.5 text-dark-text-primary focus:outline-none focus:border-primary-500"
      />
      <span className="w-3 text-[9px] shrink-0 text-center" style={{ color: arrow ? (natureMod > 1 ? '#4ade80' : '#f87171') : 'transparent' }}>
        {arrow ?? '·'}
      </span>
      <span className="text-[11px] font-mono font-bold tabular-nums shrink-0 min-w-[2rem] text-right" style={{ color: valColor }}>
        {calc}
      </span>
    </div>
  );
}


function MiniCard({ slot, lang, onRemove, onEditMoves, expanded, onUpdateEvs, onPickNature, onPickAbility, onPickItem }: {
  slot: TeamSlot; lang: string; onRemove: () => void; onEditMoves: () => void;
  expanded: boolean; onUpdateEvs: (evs: StatSpread, natureMods: NatureMods) => void;
  onPickNature: () => void; onPickAbility: () => void; onPickItem: () => void;
}) {
  const { t } = useTranslation('common');
  const { pokemon } = slot;
  const primaryType = pokemon.types[0]?.toLowerCase() ?? 'normal';
  const accent = getTypeHex(primaryType);

  const handleEvChange = (key: keyof StatSpread, val: number) => {
    onUpdateEvs({ ...slot.evs, [key]: val }, slot.natureMods);
  };

  const abilities = slot.detail?.abilities ?? [];
  const currentAbilityId = slot.selectedAbilityIdentifier ?? abilities[0]?.identifier;
  const currentAbility = abilities.find((a) => a.identifier === currentAbilityId) ?? abilities[0];
  const abilityName = currentAbility ? (lang === 'ja' && currentAbility.nameJa ? currentAbility.nameJa : currentAbility.nameEn) : null;

  return (
    <div
      className="rounded-xl border bg-dark-bg-secondary group transition-all duration-200 overflow-hidden"
      style={{ borderColor: `${accent}44`, boxShadow: `0 2px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)` }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Header: sprite + name/types + remove */}
      <div className="flex items-center gap-3 px-3 pt-2.5 pb-2" style={{ background: `linear-gradient(135deg, ${accent}1a 0%, transparent 60%)` }}>
        <div className="shrink-0">
          {pokemon.imageUrl && (
            <img src={pokemon.imageUrl} alt={pokemon.name} className="w-20 h-20 object-contain" style={{ filter: `drop-shadow(0 3px 8px ${accent}66)` }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-dark-text-primary leading-tight" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}>
            {pokemon.name}
          </p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {pokemon.types.map((ty) => <TypeIcon key={ty} type={ty} size="sm" />)}
          </div>
          {/* Ability + nature row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {abilityName && (
              <button onClick={onPickAbility} className="text-[11px] font-semibold hover:opacity-75 transition-opacity leading-none" style={{ color: `${accent}dd` }}>
                {abilityName}{abilities.length > 1 && <span className="ml-0.5 opacity-50">▾</span>}
              </button>
            )}
            <button onClick={onPickNature} className="text-[11px] px-1.5 py-0.5 rounded border transition-colors leading-none"
              style={slot.natureName
                ? { color: '#c4b5fd', borderColor: '#7c3aed44', background: '#7c3aed18' }
                : { color: '#d1d5db', borderColor: 'rgba(255,255,255,0.15)', background: 'transparent' }}>
              {slot.natureName ?? t('battleReference.nature', 'Nature')}
            </button>
          </div>
          {/* Item row */}
          <button onClick={onPickItem} className="flex items-center gap-1.5 mt-1 hover:opacity-75 transition-opacity">
            {slot.item?.spriteUrl
              ? <img src={slot.item.spriteUrl} alt="" className="w-5 h-5 object-contain" />
              : <div className="w-5 h-5 rounded border border-dashed border-white/20 flex items-center justify-center text-gray-600 text-[9px]">+</div>
            }
            <span className="text-[11px]" style={{ color: slot.item ? '#94a3b8' : '#d1d5db' }}>
              {slot.item?.name ?? t('battleReference.addItem', 'Add item')}
            </span>
          </button>
        </div>
        <button onClick={onRemove} className="shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 text-gray-400 hover:text-red-400 transition-all self-start mt-0.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: `${accent}22` }}>
          <div className="flex gap-3 pt-2">
            {/* Left: moves */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              {slot.selectedMoves.length > 0 ? slot.selectedMoves.map((m) => {
                const mColor = getTypeHex(m.type);
                return (
                  <div key={m.identifier} className="flex items-center gap-1 px-1.5 py-1 rounded-lg" style={{ background: `${mColor}18`, border: `1px solid ${mColor}30` }}>
                    <TypeIcon type={m.type} size="xs" />
                    <span className="text-[10px] font-medium text-dark-text-secondary truncate leading-tight">{getMoveName(m, lang)}</span>
                  </div>
                );
              }) : (
                <p className="text-[11px] text-gray-300 italic">
                  {slot.detailLoading ? t('battleReference.loadingItems', 'Loading...') : t('battleReference.noMovesSelected', 'No moves selected')}
                </p>
              )}
              <button onClick={onEditMoves} disabled={slot.detailLoading}
                className="text-[11px] font-semibold text-primary-400 hover:text-primary-300 disabled:opacity-40 transition-colors mt-auto">
                {slot.detailLoading ? '...' : slot.selectedMoves.length === 0 ? t('battleReference.addMoves', '+ Add moves') : t('battleReference.editMoves', 'Edit moves')}
              </button>
            </div>
            {/* Right: stats */}
            <div className="space-y-1 shrink-0 border-l pl-3" style={{ borderColor: `${accent}22` }}>
              {STAT_ROWS.map(({ key, label, baseKey, color }) => (
                <StatEvRow
                  key={key}
                  label={label}
                  color={color}
                  base={(pokemon as unknown as Record<string, number>)[baseKey as string] ?? 0}
                  ev={slot.evs[key]}
                  natureMod={slot.natureMods[key as keyof NatureMods] ?? 1}
                  onChangeEv={(v) => handleEvChange(key, v)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OpponentMiniCard({ slot, lang, onRemove, expanded, onOpenDetail, onUpdateEvs, onPickNature, onPickAbility, onPickItem }: {
  slot: OpponentSlot; lang: string; onRemove: () => void;
  expanded: boolean; onOpenDetail: () => void;
  onUpdateEvs: (evs: StatSpread, natureMods: NatureMods) => void;
  onPickNature: () => void; onPickAbility: () => void; onPickItem: () => void;
}) {
  const { t } = useTranslation('common');
  const { pokemon, detail, loading } = slot;
  const primaryType = pokemon.types[0]?.toLowerCase() ?? 'normal';
  const accent = getTypeHex(primaryType);

  const handleEvChange = (key: keyof StatSpread, val: number) => {
    onUpdateEvs({ ...slot.evs, [key]: val }, slot.natureMods);
  };

  const abilities = detail?.abilities ?? [];
  const currentAbilityId = slot.selectedAbilityIdentifier ?? abilities[0]?.identifier;
  const currentAbility = abilities.find((a) => a.identifier === currentAbilityId) ?? abilities[0];
  const abilityName = currentAbility ? (lang === 'ja' && currentAbility.nameJa ? currentAbility.nameJa : currentAbility.nameEn) : null;

  return (
    <div
      className="rounded-xl border bg-dark-bg-secondary group transition-all duration-200 overflow-hidden"
      style={{ borderColor: `${accent}44`, boxShadow: `0 2px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)` }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Header */}
      <div className="flex items-center gap-3 px-3 pt-2.5 pb-2" style={{ background: `linear-gradient(135deg, ${accent}1a 0%, transparent 60%)` }}>
        <div className="shrink-0">
          {loading && <div className="flex items-center justify-center w-20 h-20"><div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>}
          {pokemon.imageUrl && (
            <img src={pokemon.imageUrl} alt={pokemon.name} className="w-20 h-20 object-contain" style={{ filter: `drop-shadow(0 3px 8px ${accent}66)` }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-dark-text-primary leading-tight" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.03em' }}>
            {pokemon.name}
          </p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {pokemon.types.map((ty) => <TypeIcon key={ty} type={ty} size="sm" />)}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {abilityName && (
              <button onClick={onPickAbility} className="text-[11px] font-semibold hover:opacity-75 transition-opacity leading-none" style={{ color: `${accent}dd` }}>
                {abilityName}{abilities.length > 1 && <span className="ml-0.5 opacity-50">▾</span>}
              </button>
            )}
            <button onClick={onPickNature} className="text-[11px] px-1.5 py-0.5 rounded border transition-colors leading-none"
              style={slot.natureName
                ? { color: '#c4b5fd', borderColor: '#7c3aed44', background: '#7c3aed18' }
                : { color: '#d1d5db', borderColor: 'rgba(255,255,255,0.15)', background: 'transparent' }}>
              {slot.natureName ?? t('battleReference.nature', 'Nature')}
            </button>
          </div>
          <button onClick={onPickItem} className="flex items-center gap-1.5 mt-1 hover:opacity-75 transition-opacity">
            {slot.item?.spriteUrl
              ? <img src={slot.item.spriteUrl} alt="" className="w-5 h-5 object-contain" />
              : <div className="w-5 h-5 rounded border border-dashed border-white/20 flex items-center justify-center text-gray-400 text-[9px]">+</div>
            }
            <span className="text-[11px]" style={{ color: slot.item ? '#94a3b8' : '#d1d5db' }}>
              {slot.item?.name ?? t('battleReference.addItem', 'Add item')}
            </span>
          </button>
        </div>
        <button onClick={onRemove} className="shrink-0 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full bg-black/40 text-gray-400 hover:text-red-400 transition-all self-start mt-0.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: `${accent}22` }}>
          <div className="flex gap-3 pt-2">
            {/* Left: all moves link */}
            <div className="flex-1 min-w-0 flex flex-col justify-end">
              <button onClick={onOpenDetail}
                className="text-[11px] font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                {t('battleReference.viewDetail', 'All moves')}
              </button>
            </div>
            {/* Right: stats */}
            <div className="space-y-1 shrink-0 border-l pl-3" style={{ borderColor: `${accent}22` }}>
              {STAT_ROWS.map(({ key, label, baseKey, color }) => (
                <StatEvRow
                  key={key}
                  label={label}
                  color={color}
                  base={(pokemon as unknown as Record<string, number>)[baseKey as string] ?? 0}
                  ev={slot.evs[key]}
                  natureMod={slot.natureMods[key as keyof NatureMods] ?? 1}
                  onChangeEv={(v) => handleEvChange(key, v)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed text-gray-600 hover:border-primary-500 hover:text-primary-400 transition-all duration-200"
      style={{ borderColor: 'rgba(255,255,255,0.15)', minHeight: 80 }}
    >
      <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-[10px] font-semibold">Add</span>
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
                  <p className="text-sm text-gray-300 text-center py-8">{t('battleReference.noMoves', 'No moves found.')}</p>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-white/5">
                    {filteredMoves.map((move) => (
                      <div
                        key={move.identifier}
                        className="px-4 py-2 grid gap-2 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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

    const weakTypes = TYPES.flatMap((atk) => {
      const eff = getEffectiveness(atk, def1, def2);
      return eff > 1 ? [{ type: atk, multiplier: eff }] : [];
    });

    const safeCount = cells.filter((c) => c.val <= 1).length;
    return { slot, cells, safeCount, weakTypes };
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
          {rows.map(({ slot, cells, safeCount, weakTypes }) => (
            <tr key={slot.pokemon.id} className="border-t border-gray-100 dark:border-white/5">
              <td className="py-1.5 pr-3">
                <div className="flex items-center gap-1.5">
                  {slot.pokemon.imageUrl && (
                    <img src={slot.pokemon.imageUrl} alt={slot.pokemon.name} className="w-6 h-6 object-contain shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{slot.pokemon.name}</span>
                    {weakTypes.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {weakTypes.map(({ type, multiplier }) => (
                          <span key={type} className="inline-flex items-center gap-0.5">
                            <TypeIcon type={type} size="xs" />
                            <span className={`text-[9px] font-bold leading-none ${multiplier >= 4 ? 'text-red-500' : 'text-orange-400'}`}>
                              {multiplier}x
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
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

  type Row = {
    id: string;
    pokemon: Pokemon;
    side: 'mine' | 'opp';
    base: number;
    lowered: number;
    noSp: number;
    maxSp: number;
    boosted: number;
    actual: number;
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
        actual: calcSpeed(base, slot.evs.speed, slot.natureMods.speed),
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
        actual: calcSpeed(base, slot.evs.speed, slot.natureMods.speed),
      };
    }),
  ];

  // Per-pokemon scenario selection
  const [scenarios, setScenarios] = useState<Record<string, SpeedScenario>>({});
  const getScenario = (row: Row): SpeedScenario => scenarios[row.id] ?? (row.side === 'mine' ? 'actual' : 'maxSp');
  const setScenario = (id: string, val: SpeedScenario) =>
    setScenarios((prev) => ({ ...prev, [id]: val }));

  const scenarioBtns: { value: SpeedScenario; label: string }[] = [
    { value: 'lowered', label: t('pokemon.detail.statColLowered', 'Lowered') },
    { value: 'noSp',    label: t('pokemon.detail.statColNoSP', '0 SP') },
    { value: 'maxSp',   label: t('pokemon.detail.statColMaxSP', '32 SP') },
    { value: 'boosted', label: t('pokemon.detail.statColBoosted', 'Boosted') },
    { value: 'actual' as SpeedScenario, label: t('battleReference.actual', 'Actual') },
  ];

  // Speed order panel: sorted descending by each pokemon's selected scenario
  const speedOrder = [...rows].sort((a, b) => {
    const aVal = (a[getScenario(a)] ?? a.maxSp) as number;
    const bVal = (b[getScenario(b)] ?? b.maxSp) as number;
    return bVal - aVal;
  });

  if (myTeam.length === 0 && filledOpponents.length === 0) return null;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left: stat table with per-row scenario buttons */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm border-collapse font-mono">
          <thead>
            <tr>
              <th className="text-left pb-2 pr-1 text-xs text-gray-500 dark:text-gray-400 font-medium font-sans w-px whitespace-nowrap">
                {t('battleReference.pokemon', 'Pokemon')}
              </th>
              <th className="pb-2 pr-2 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
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
              <th className="pb-2 px-1 text-right text-xs text-amber-500 dark:text-amber-400 font-medium">
                {t('battleReference.actual', 'Actual')}
              </th>
              <th className="pb-2 pl-1 text-xs text-gray-500 dark:text-gray-400 font-medium font-sans whitespace-nowrap w-px">
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
                  <td className="py-1.5 pr-1 font-sans w-px whitespace-nowrap">
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
                  <td className="py-1.5 pr-2 text-right text-gray-600 dark:text-gray-400">{row.base}</td>
                  {(['lowered', 'noSp', 'maxSp', 'boosted'] as SpeedScenario[]).map((key) => (
                    <td key={key} className={`py-1.5 px-1 text-right tabular-nums ${scenario === key ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                      {row[key]}
                    </td>
                  ))}
                  <td className={`py-1.5 px-1 text-right tabular-nums ${scenario === 'actual' ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-amber-500/60 dark:text-amber-500/40'}`}>
                    {row.actual}
                  </td>
                  {/* Scenario selector buttons */}
                  <td className="py-1 pl-1 w-px whitespace-nowrap">
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
  const [filterIds, setFilterIds] = useState<Set<number>>(new Set());
  const filledOpponents = opponents.filter((o) => o.detail);
  const slotsWithMoves = myTeam.filter((s) => s.selectedMoves.length > 0);

  if (slotsWithMoves.length === 0 || filledOpponents.length === 0) return null;

  const toggleFilter = (id: number) => {
    setFilterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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

  const rows = filterIds.size === 0
    ? allRows
    : allRows.filter((r) => filterIds.has(r.pokemon.id));

  const showFilter = slotsWithMoves.length > 1;

  return (
    <div className="space-y-3">
      {/* Pokemon filter chips — multi-select, no "All" button */}
      {showFilter && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {slotsWithMoves.map((slot) => (
            <button
              key={slot.pokemon.id}
              onClick={() => toggleFilter(slot.pokemon.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-colors ${
                filterIds.has(slot.pokemon.id)
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
          {rows.map(({ pokemon, move, cells }, i) => {
            const isNewPokemon = i > 0 && rows[i - 1].pokemon.id !== pokemon.id;
            return (
            <tr key={`${pokemon.id}-${move.identifier}`} className={isNewPokemon ? 'border-t-2 border-white/30' : 'border-t border-gray-100 dark:border-white/5'}>
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
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BattleReferencePage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Natures
  const [natures, setNatures] = useState<Nature[]>([]);
  const [naturePickerFor, setNaturePickerFor] = useState<{ id: number; side: 'mine' | 'opp' } | null>(null);
  const [abilityPickerFor, setAbilityPickerFor] = useState<{ id: number; side: 'mine' | 'opp' } | null>(null);
  const [itemPickerFor, setItemPickerFor] = useState<{ id: number; side: 'mine' | 'opp' } | null>(null);

  React.useEffect(() => {
    naturesService.getNatures(lang).then((res) => {
      if (res.success && res.data) setNatures(res.data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!isAuthenticated) {
      router.push('/auth?redirect=/battle-reference');
      return;
    }
    setLoadingTeams(true);
    setShowTeamImport(true);
    const res = await teamService.getMyTeams(lang);
    if (res.success && res.data) {
      setSavedTeams(res.data.teams);
    }
    setLoadingTeams(false);
  }, [lang, isAuthenticated, router]);

  const handleUpdateMyEvs = useCallback((id: number, evs: StatSpread, natureMods: NatureMods) => {
    setMyTeam((prev) => prev.map((s) => s.pokemon.id === id ? { ...s, evs, natureMods } : s));
  }, []);

  const handleUpdateOppEvs = useCallback((id: number, evs: StatSpread, natureMods: NatureMods) => {
    setOpponents((prev) => prev.map((o) => o.pokemon.id === id ? { ...o, evs, natureMods } : o));
  }, []);

  const handleSelectMyAbility = useCallback((id: number, identifier: string) => {
    setMyTeam((prev) => prev.map((s) => s.pokemon.id === id ? { ...s, selectedAbilityIdentifier: identifier } : s));
  }, []);

  const handleSelectOppAbility = useCallback((id: number, identifier: string) => {
    setOpponents((prev) => prev.map((o) => o.pokemon.id === id ? { ...o, selectedAbilityIdentifier: identifier } : o));
  }, []);

  const handleSelectMyItem = useCallback((id: number, item: Item | null) => {
    setMyTeam((prev) => prev.map((s) => s.pokemon.id === id ? { ...s, item: item ? { name: item.name, spriteUrl: item.spriteUrl } : undefined } : s));
  }, []);

  const handleSelectOppItem = useCallback((id: number, item: Item | null) => {
    setOpponents((prev) => prev.map((o) => o.pokemon.id === id ? { ...o, item: item ? { name: item.name, spriteUrl: item.spriteUrl } : undefined } : o));
  }, []);

  const handleSelectMyNature = useCallback((natureId: number) => {
    if (!naturePickerFor || naturePickerFor.side !== 'mine') return;
    const nature = natures.find((n) => n.id === natureId);
    if (!nature) return;
    const natureMods = natureModsFromData(nature.increasedStat, nature.decreasedStat);
    setMyTeam((prev) => prev.map((s) =>
      s.pokemon.id === naturePickerFor.id ? { ...s, natureMods, natureName: nature.name } : s
    ));
    setNaturePickerFor(null);
  }, [naturePickerFor, natures]);

  const handleSelectOppNature = useCallback((natureId: number) => {
    if (!naturePickerFor || naturePickerFor.side !== 'opp') return;
    const nature = natures.find((n) => n.id === natureId);
    if (!nature) return;
    const natureMods = natureModsFromData(nature.increasedStat, nature.decreasedStat);
    setOpponents((prev) => prev.map((o) =>
      o.pokemon.id === naturePickerFor.id ? { ...o, natureMods, natureName: nature.name } : o
    ));
    setNaturePickerFor(null);
  }, [naturePickerFor, natures]);

  // Import a saved team into My Team slots
  const handleImportTeam = useCallback((team: Team) => {
    const slots: TeamSlot[] = team.pokemon.slice(0, MAX_TEAM_SIZE).map((tp) => {
      if (!tp.pokemonData) return null;
      const bs = tp.pokemonData.baseStats;
      const pokemon: Pokemon = {
        id: tp.pokemonData.id,
        nationalNumber: tp.pokemonData.nationalNumber,
        name: tp.pokemonData.name,
        nameLower: tp.pokemonData.nameLower,
        types: tp.pokemonData.types,
        imageUrl: tp.pokemonData.imageUrl,
        hpBase: bs?.hp, attackBase: bs?.attack,
        defenseBase: bs?.defense, spAtkBase: bs?.specialAttack,
        spDefBase: bs?.specialDefense, speedBase: bs?.speed,
        hpMax: 0, attackMax: 0, defenseMax: 0, spAtkMax: 0, spDefMax: 0, speedMax: 0,
        statTotal: 0, ability1: tp.abilityData?.name ?? '',
      };
      const evs: StatSpread = tp.evs ?? { ...DEFAULT_EVS };
      const natureMods = natureModsFromData(tp.natureData?.increasedStat, tp.natureData?.decreasedStat);
      const item = tp.itemData ? { name: tp.itemData.name, spriteUrl: tp.itemData.spriteUrl ?? undefined } : undefined;
      const selectedMoves: ChampionsMoveEntry[] = (tp.movesData ?? []).map((m) => ({
        id: 0,
        identifier: m.identifier,
        nameEn: m.nameEn,
        nameJa: m.nameJa ?? null,
        type: m.type,
        category: m.category,
        power: m.power,
        accuracy: m.accuracy,
        pp: m.pp,
        effectPct: null,
        description: m.description ?? null,
      }));
      return { pokemon, evs, natureMods, item, natureName: tp.natureData?.name, detail: null, detailLoading: false, selectedMoves };
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
    const current = myTeamRef.current;
    if (current.length >= MAX_TEAM_SIZE || current.some((s) => s.pokemon.id === pokemon.id)) return;
    setShowMySelector(false);
    setMyTeam((prev) => [...prev, { pokemon, evs: { ...DEFAULT_EVS }, natureMods: { ...DEFAULT_NATURE_MODS }, detail: null, detailLoading: true, selectedMoves: [] }]);
    const nameLower = pokemon.nameLower ?? pokemon.name.toLowerCase().replace(/\s+/g, '-');
    const res = await pokemonBuilderService.getPokemonBySlug(nameLower, lang);
    setMyTeam((prev) => prev.map((s) =>
      s.pokemon.id === pokemon.id
        ? { ...s, detail: res.success && res.data ? res.data : null, detailLoading: false }
        : s
    ));
  }, [lang]);

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
    const current = opponentsRef.current;
    if (current.length >= MAX_TEAM_SIZE || current.some((o) => o.pokemon.id === pokemon.id)) return;
    setShowOppSelector(false);

    const slot: OpponentSlot = { pokemon, evs: { ...DEFAULT_EVS }, natureMods: { ...DEFAULT_NATURE_MODS }, detail: null, loading: true };
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
  }, [lang]);

  const handleRemoveOpponent = useCallback((id: number) => {
    setOpponents((prev) => prev.filter((o) => o.pokemon.id !== id));
  }, []);

  const mySelectedIds = useMemo(() => myTeam.map((s) => s.pokemon.id), [myTeam]);
  const oppSelectedIds = useMemo(() => opponents.map((o) => o.pokemon.id), [opponents]);

  const [teamsExpanded, setTeamsExpanded] = useState(true);

  return (
    <>
      <Head>
        <title>{t('battleReference.pageTitle', 'Battle Reference')} | Pokemon Champion</title>
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

          <div>
            <h1 className="text-2xl font-bold text-dark-text-primary mb-0.5" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.04em' }}>
              {t('battleReference.title', 'Battle Reference')}
            </h1>
            <p className="text-sm text-dark-text-secondary">
              {t('battleReference.subtitle', 'Set up your team and analyze matchups against opponents.')}
            </p>
          </div>

          {/* ── Teams panel ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'var(--color-bg-secondary)' }}>

            {/* Shared header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: teamsExpanded ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#60a5fa' }}>{t('battleReference.myTeam', 'My Team')}</span>
                  <span className="text-xs text-dark-text-secondary">{myTeam.length}/{MAX_TEAM_SIZE}</span>
                  <button
                    onClick={handleLoadSavedTeams}
                    className="flex items-center gap-1 text-xs text-dark-text-secondary hover:text-primary-400 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {t('battleReference.importTeam', 'Import')}
                  </button>
                </div>
                <span className="text-xs text-dark-text-tertiary">vs</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#f87171' }}>{t('battleReference.opponent', 'Opponent')}</span>
                  <span className="text-xs text-dark-text-secondary">{opponents.length}/{MAX_TEAM_SIZE}</span>
                </div>
              </div>
              <button
                onClick={() => setTeamsExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-dark-text-secondary hover:text-dark-text-primary transition-colors"
              >
                {teamsExpanded ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${teamsExpanded ? '' : '-rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>

            {/* Team import dropdown */}
            {showTeamImport && (
              <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
                <div className="rounded-lg border border-white/10 bg-dark-bg-tertiary p-2 space-y-1 max-h-40 overflow-y-auto">
                  {loadingTeams ? (
                    <div className="flex justify-center py-2">
                      <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : savedTeams.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-2">{t('battleReference.noTeams', 'No saved teams.')}</p>
                  ) : (
                    savedTeams.map((team) => (
                      <button key={team.id} onClick={() => handleImportTeam(team)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 text-xs text-dark-text-secondary">
                        {team.name}
                      </button>
                    ))
                  )}
                  <button onClick={() => setShowTeamImport(false)} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 pt-1">
                    {t('common.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            )}

            {teamsExpanded ? (
              /* Expanded: two stacked full-card sections */
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* My Team */}
                <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 60%)' }}>
                  <div className="grid grid-cols-3 gap-2">
                    {myTeam.map((slot) => (
                      <MiniCard
                        key={slot.pokemon.id}
                        slot={slot}
                        lang={lang}
                        expanded={true}
                        onRemove={() => handleRemoveMyPokemon(slot.pokemon.id)}
                        onEditMoves={() => setMovePickerPokemonId(slot.pokemon.id)}
                        onUpdateEvs={(evs, mods) => handleUpdateMyEvs(slot.pokemon.id, evs, mods)}
                        onPickNature={() => setNaturePickerFor({ id: slot.pokemon.id, side: 'mine' })}
                        onPickAbility={() => setAbilityPickerFor({ id: slot.pokemon.id, side: 'mine' })}
                        onPickItem={() => setItemPickerFor({ id: slot.pokemon.id, side: 'mine' })}
                      />
                    ))}
                    {myTeam.length < MAX_TEAM_SIZE && (
                      <AddSlotButton onClick={() => setShowMySelector(true)} />
                    )}
                  </div>
                </div>
                {/* Opponent */}
                <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, transparent 60%)' }}>
                  <div className="grid grid-cols-3 gap-2">
                    {opponents.map((slot) => (
                      <OpponentMiniCard
                        key={slot.pokemon.id}
                        slot={slot}
                        lang={lang}
                        expanded={true}
                        onRemove={() => handleRemoveOpponent(slot.pokemon.id)}
                        onOpenDetail={() => setDetailModalPokemonId(slot.pokemon.id)}
                        onUpdateEvs={(evs, mods) => handleUpdateOppEvs(slot.pokemon.id, evs, mods)}
                        onPickNature={() => setNaturePickerFor({ id: slot.pokemon.id, side: 'opp' })}
                        onPickAbility={() => setAbilityPickerFor({ id: slot.pokemon.id, side: 'opp' })}
                        onPickItem={() => setItemPickerFor({ id: slot.pokemon.id, side: 'opp' })}
                      />
                    ))}
                    {opponents.length < MAX_TEAM_SIZE && (
                      <AddSlotButton onClick={() => setShowOppSelector(true)} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Collapsed: single row of 12 tiles — 6 mine | divider | 6 opponent */
              <div className="flex items-center gap-1.5 px-3 py-3">
                {Array.from({ length: MAX_TEAM_SIZE }).map((_, i) => {
                  const slot = myTeam[i];
                  if (!slot) {
                    return (
                      <button key={`my-${i}`} onClick={() => setShowMySelector(true)}
                        className="relative flex-1 aspect-square rounded-lg border border-dashed flex items-center justify-center text-gray-600 hover:border-primary-500 hover:text-primary-400 transition-colors"
                        style={{ borderColor: 'rgba(59,130,246,0.2)', minWidth: 0 }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    );
                  }
                  const accent = getTypeHex(slot.pokemon.types[0]?.toLowerCase() ?? 'normal');
                  return (
                    <div key={`my-${slot.pokemon.id}`} className="relative flex-1 aspect-square rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${accent}0a 100%)`, border: `1px solid ${accent}44`, minWidth: 0 }}>
                      {slot.pokemon.imageUrl && (
                        <img src={slot.pokemon.imageUrl} alt={slot.pokemon.name} className="w-full h-full object-contain p-1"
                          style={{ filter: `drop-shadow(0 2px 6px ${accent}55)` }} />
                      )}
                      {slot.item?.spriteUrl && (
                        <img src={slot.item.spriteUrl} alt={slot.item.name} title={slot.item.name}
                          className="absolute bottom-0.5 right-0.5 w-8 h-8 object-contain"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }} />
                      )}
                    </div>
                  );
                })}

                {/* Divider */}
                <div className="shrink-0 w-px self-stretch mx-1" style={{ background: 'rgba(255,255,255,0.12)' }} />

                {Array.from({ length: MAX_TEAM_SIZE }).map((_, i) => {
                  const slot = opponents[i];
                  if (!slot) {
                    return (
                      <button key={`opp-${i}`} onClick={() => setShowOppSelector(true)}
                        className="relative flex-1 aspect-square rounded-lg border border-dashed flex items-center justify-center text-gray-600 hover:border-red-500 hover:text-red-400 transition-colors"
                        style={{ borderColor: 'rgba(239,68,68,0.2)', minWidth: 0 }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    );
                  }
                  const accent = getTypeHex(slot.pokemon.types[0]?.toLowerCase() ?? 'normal');
                  return (
                    <div key={`opp-${slot.pokemon.id}`} className="relative flex-1 aspect-square rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${accent}0a 100%)`, border: `1px solid ${accent}44`, minWidth: 0 }}>
                      {slot.pokemon.imageUrl && (
                        <img src={slot.pokemon.imageUrl} alt={slot.pokemon.name} className="w-full h-full object-contain p-1"
                          style={{ filter: `drop-shadow(0 2px 6px ${accent}55)` }} />
                      )}
                      {slot.item?.spriteUrl && (
                        <img src={slot.item.spriteUrl} alt={slot.item.name} title={slot.item.name}
                          className="absolute bottom-0.5 right-0.5 w-8 h-8 object-contain"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Analysis sections ── */}
          <div className="space-y-4">
            {/* Threat Analysis */}
            {myTeam.length > 0 && opponents.some((o) => o.detail) && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-dark-text-secondary mb-3 flex items-center gap-2">
                  {t('battleReference.threatAnalysis', 'Threat Analysis')}
                  <span className="group relative cursor-help w-3.5 h-3.5 rounded-full bg-white/10 text-gray-400 inline-flex items-center justify-center text-[9px] font-bold flex-shrink-0">?<span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded bg-gray-900 px-2 py-1.5 text-[11px] font-normal text-gray-200 leading-snug opacity-0 group-hover:opacity-100 transition-none z-50 whitespace-normal">{t('battleReference.threatAnalysisHelp', 'Worst-case type effectiveness of any damaging move each opponent can learn against your team.')}</span></span>
                </h2>
                <div className="rounded-xl border border-white/10 bg-dark-bg-secondary p-4">
                  <ThreatTable myTeam={myTeam} opponents={opponents} />
                </div>
              </section>
            )}

            {/* Move Analysis */}
            {myTeam.some((s) => s.selectedMoves.length > 0) && opponents.some((o) => o.detail) && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-dark-text-secondary mb-3 flex items-center gap-2">
                  {t('battleReference.moveAnalysis', 'Move Analysis')}
                  <span className="group relative cursor-help w-3.5 h-3.5 rounded-full bg-white/10 text-gray-400 inline-flex items-center justify-center text-[9px] font-bold flex-shrink-0">?<span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded bg-gray-900 px-2 py-1.5 text-[11px] font-normal text-gray-200 leading-snug opacity-0 group-hover:opacity-100 transition-none z-50 whitespace-normal">{t('battleReference.moveAnalysisHelp', 'Type effectiveness of your selected moves against each opponent.')}</span></span>
                </h2>
                <div className="rounded-xl border border-white/10 bg-dark-bg-secondary p-4">
                  <MoveAnalysisTable myTeam={myTeam} opponents={opponents} lang={lang} />
                </div>
              </section>
            )}

            {/* Speed Comparison */}
            {(myTeam.length > 0 || opponents.some((o) => o.detail)) && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-dark-text-secondary mb-3 flex items-center gap-2">
                  {t('battleReference.speedComparison', 'Speed Comparison')}
                  <span className="group relative cursor-help w-3.5 h-3.5 rounded-full bg-white/10 text-gray-400 inline-flex items-center justify-center text-[9px] font-bold flex-shrink-0">?<span className="pointer-events-none absolute left-0 bottom-full mb-1.5 w-56 rounded bg-gray-900 px-2 py-1.5 text-[11px] font-normal text-gray-200 leading-snug opacity-0 group-hover:opacity-100 transition-none z-50 whitespace-normal">{t('battleReference.speedComparisonHelp', 'Calculated Speed stats. Lowered = 0 SP, ×0.9 nature. Boosted = 32 SP, ×1.1 nature.')}</span></span>
                </h2>
                <div className="rounded-xl border border-white/10 bg-dark-bg-secondary p-4">
                  <SpeedTable myTeam={myTeam} opponents={opponents} />
                </div>
              </section>
            )}
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
              pokemonName={slot.pokemon.name}
              availableMoves={slot.detail?.moves ?? []}
              selectedMoves={slot.selectedMoves}
              lang={lang}
              onClose={() => setMovePickerPokemonId(null)}
              onToggleMove={(move) => handleToggleMove(slot.pokemon.id, move)}
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

        {/* Item picker modal */}
        {itemPickerFor !== null && (() => {
          const slot = itemPickerFor.side === 'mine'
            ? myTeam.find((s) => s.pokemon.id === itemPickerFor.id)
            : opponents.find((o) => o.pokemon.id === itemPickerFor.id);
          if (!slot) return null;
          return (
            <ItemPickerModal
              lang={lang}
              selectedItem={slot.item}
              onSelect={(item) => {
                if (itemPickerFor.side === 'mine') handleSelectMyItem(slot.pokemon.id, item);
                else handleSelectOppItem(slot.pokemon.id, item);
              }}
              onClear={() => {
                if (itemPickerFor.side === 'mine') handleSelectMyItem(slot.pokemon.id, null);
                else handleSelectOppItem(slot.pokemon.id, null);
              }}
              onClose={() => setItemPickerFor(null)}
            />
          );
        })()}

        {/* Ability picker modal */}
        {abilityPickerFor !== null && (() => {
          const slot = abilityPickerFor.side === 'mine'
            ? myTeam.find((s) => s.pokemon.id === abilityPickerFor.id)
            : opponents.find((o) => o.pokemon.id === abilityPickerFor.id);
          const abilities = slot?.detail?.abilities;
          if (!slot || !abilities || abilities.length === 0) return null;
          const currentId = slot.selectedAbilityIdentifier ?? abilities[0].identifier;
          return (
            <AbilityPickerModal
              abilities={abilities}
              selectedIdentifier={currentId}
              lang={lang}
              onSelect={(identifier) => {
                if (abilityPickerFor.side === 'mine') handleSelectMyAbility(slot.pokemon.id, identifier);
                else handleSelectOppAbility(slot.pokemon.id, identifier);
              }}
              onClose={() => setAbilityPickerFor(null)}
            />
          );
        })()}

        {/* Nature picker modal */}
        {naturePickerFor !== null && natures.length > 0 && (() => {
          const slot = naturePickerFor.side === 'mine'
            ? myTeam.find((s) => s.pokemon.id === naturePickerFor.id)
            : opponents.find((o) => o.pokemon.id === naturePickerFor.id);
          if (!slot) return null;
          const selectedNatureId = natures.find((n) => n.name === slot.natureName)?.id ?? 0;
          return (
            <NaturePickerModal
              natures={natures}
              selectedNatureId={selectedNatureId}
              onSelect={naturePickerFor.side === 'mine' ? handleSelectMyNature : handleSelectOppNature}
              onClose={() => setNaturePickerFor(null)}
            />
          );
        })()}

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
