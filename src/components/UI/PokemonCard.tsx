import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { TypeIcon } from './TypeIcon';
import { TeraTypeIcon } from './TeraTypeIcon';
import { MoveCategoryIcon, MoveCategory } from './MoveCategoryIcon';
import { getTypeHex } from '@/utils/typeColors';

interface StatSpread {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface PokemonCardProps {
  pokemon?: {
    level?: number;
    pokemonId?: number;
    pokemonData?: {
      name?: string;
      imageUrl?: string;
      types?: string[];
      nationalNumber?: number;
      baseStats?: StatSpread;
    };
    itemData?: {
      spriteUrl?: string;
      name?: string;
      identifier?: string;
    };
    movesData?: Array<{
      name?: string;
      type?: string;
      identifier?: string;
      power?: number | null;
      accuracy?: number | null;
      pp?: number | null;
      category?: string;
    }>;
    abilityData?: {
      name?: string;
    };
    abilityIdentifier?: string;
    natureData?: {
      name?: string;
      increasedStat?: string;
      decreasedStat?: string;
    };
    natureId?: number;
    teraType?: string;
    evs?: StatSpread;
    ivs?: StatSpread;
  };
  onRemove?: (e: React.MouseEvent) => void;
  showRemoveButton?: boolean;
  showSlotNumber?: boolean;
  slotNumber?: number;
  variant?: 'compact' | 'detailed';
  enableLinks?: boolean;
  className?: string;
}

const STAT_LABELS: { key: keyof StatSpread; label: string; color: string }[] = [
  { key: 'hp',             label: 'HP',   color: '#4ade80' },
  { key: 'attack',         label: 'Atk',  color: '#f97316' },
  { key: 'defense',        label: 'Def',  color: '#facc15' },
  { key: 'specialAttack',  label: 'SpA',  color: '#60a5fa' },
  { key: 'specialDefense', label: 'SpD',  color: '#a78bfa' },
  { key: 'speed',          label: 'Spe',  color: '#34d399' },
];

const NATURE_STAT_KEY: Record<string, keyof StatSpread> = {
  attack: 'attack', defense: 'defense',
  specialAttack: 'specialAttack', specialDefense: 'specialDefense', speed: 'speed',
  // DB column name variants
  sp_atk: 'specialAttack', sp_def: 'specialDefense',
};

function calcStat(
  key: keyof StatSpread,
  base: number,
  ev: number,
  iv: number,
  level: number,
  increasedStat?: string,
  decreasedStat?: string,
): number {
  const statVal = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100);
  if (key === 'hp') {
    return statVal + level + 10;
  }
  let natureMod = 1;
  if (increasedStat && NATURE_STAT_KEY[increasedStat] === key) natureMod = 1.1;
  if (decreasedStat && NATURE_STAT_KEY[decreasedStat] === key) natureMod = 0.9;
  return Math.floor((statVal + 5) * natureMod);
}


/**
 * Reusable Pokemon card display component
 */
export function PokemonCard({
  pokemon,
  onRemove,
  showRemoveButton = false,
  showSlotNumber = false,
  slotNumber,
  variant = 'compact',
  enableLinks = false,
  className = '',
}: PokemonCardProps) {
  const { t } = useTranslation('common');

  const getHeaderGradient = () => {
    const types = pokemon?.pokemonData?.types || [];
    if (types.length === 2) {
      const c1 = getTypeHex(types[0]);
      const c2 = getTypeHex(types[1]);
      return `linear-gradient(135deg, ${c1}cc 0%, ${c2}cc 100%)`;
    }
    const c = getTypeHex(types[0] || 'normal');
    return `linear-gradient(135deg, ${c}cc 0%, ${c}44 100%)`;
  };

  const evs = pokemon?.evs;
  const defaultEv: StatSpread = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };

  const nature = pokemon?.natureData;

  if (variant === 'detailed') {
    const statLabel = (stat: string) =>
      stat === 'sp_atk' ? 'SpA' : stat === 'sp_def' ? 'SpD' :
      stat.replace('specialAttack', 'SpA').replace('specialDefense', 'SpD')
        .replace('attack', 'Atk').replace('defense', 'Def').replace('speed', 'Spe');

    const types = pokemon?.pokemonData?.types || [];
    const c1 = getTypeHex(types[0] || 'normal');
    const c2 = getTypeHex(types[1] || types[0] || 'normal');

    return (
      <div
        className={`relative rounded-2xl overflow-hidden flex flex-col h-full group ${className}`}
        style={{
          background: `linear-gradient(160deg, ${c1}55 0%, var(--color-bg-primary) 50%, var(--color-bg-secondary) 100%)`,
          border: `1px solid ${c1}88`,
          boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 12px ${c1}33`,
        }}
      >
        {/* ── TOP SECTION: sprite left, info right ── */}
        <div className="flex" style={{ background: getHeaderGradient() }}>
          {/* Sprite */}
          <div className="relative shrink-0 flex items-end justify-center w-24 pb-1">
            {pokemon?.teraType && (
              <div className="absolute top-1.5 left-1.5 flex flex-col items-center z-10">
                <TeraTypeIcon type={pokemon.teraType} />
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/70 leading-none mt-0.5">Tera</span>
              </div>
            )}
            {pokemon?.pokemonData?.imageUrl ? (
              <img
                src={pokemon.pokemonData.imageUrl}
                alt={pokemon.pokemonData.name}
                className="w-20 h-20 object-contain"
                style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))' }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10" />
            )}
            {pokemon?.itemData?.spriteUrl && (
              <img
                src={pokemon.itemData.spriteUrl}
                alt={pokemon.itemData.name || ''}
                title={pokemon.itemData.name}
                className="absolute bottom-1 right-1 w-7 h-7 object-contain z-10"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
              />
            )}
          </div>

          {/* Info: left col (name/types/item/ability) + right col (level/nature) */}
          <div className="flex-1 min-w-0 flex gap-2 py-2.5 pr-3">
            {/* Left: name, types, item, ability */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              {/* Name + types */}
              <div className="flex items-center gap-1.5 min-w-0">
                {enableLinks && (pokemon?.pokemonData?.nationalNumber || pokemon?.pokemonId) ? (
                  <Link
                    href={`/pokemon/${pokemon.pokemonData?.nationalNumber || pokemon.pokemonId}`}
                    className="font-extrabold text-base leading-tight text-white hover:text-yellow-300 transition-colors drop-shadow truncate"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {pokemon?.pokemonData?.name || 'Unknown'}
                  </Link>
                ) : (
                  <span
                    className="font-extrabold text-base leading-tight text-white drop-shadow truncate"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {pokemon?.pokemonData?.name || 'Unknown'}
                  </span>
                )}
                <div className="flex gap-0.5 shrink-0">
                  {pokemon?.pokemonData?.types?.map((type: string) => (
                    <TypeIcon key={type} type={type} size="xs" />
                  ))}
                </div>
              </div>

              {/* Ability */}
              <div className="flex items-center gap-1 min-w-0">
                {enableLinks && pokemon?.abilityIdentifier ? (
                  <Link
                    href={`/data/abilities/${pokemon.abilityIdentifier}`}
                    className="text-[11px] font-semibold text-white/90 truncate hover:text-yellow-300 transition-colors"
                    title={pokemon?.abilityData?.name}
                  >
                    {pokemon?.abilityData?.name || pokemon?.abilityIdentifier || '—'}
                  </Link>
                ) : (
                  <span className="text-[11px] font-semibold text-white/90 truncate" title={pokemon?.abilityData?.name}>
                    {pokemon?.abilityData?.name || pokemon?.abilityIdentifier || '—'}
                  </span>
                )}
              </div>

              {/* Item */}
              <div className="flex items-center gap-1 min-w-0">
                {enableLinks && pokemon?.itemData?.identifier ? (
                  <Link
                    href={`/data/items/${pokemon.itemData.identifier}`}
                    className="text-[11px] font-semibold text-white/90 truncate hover:text-yellow-300 transition-colors"
                    title={pokemon.itemData.name}
                  >
                    {pokemon.itemData.name || '—'}
                  </Link>
                ) : (
                  <span className="text-[11px] font-semibold text-white/90 truncate" title={pokemon?.itemData?.name}>
                    {pokemon?.itemData?.name || '—'}
                  </span>
                )}
              </div>
            </div>

            {/* Right: level + nature (fills the empty right space) */}
            <div className="shrink-0 flex flex-col items-end justify-center gap-1">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold text-white leading-none"
                style={{ background: 'rgba(0,0,0,0.3)', fontFamily: "'Rajdhani', sans-serif" }}
              >
                Lv.{pokemon?.level ?? 50}
              </span>
              <span className="text-[11px] text-white/80 font-medium text-right">{nature?.name ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION: moves (left) + stats (right) ── */}
        <div className="flex-1 flex gap-2 p-3">

          {/* Left: moves */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
            {Array.from({ length: 4 }).map((_, i) => {
              const move = pokemon?.movesData?.[i];
              if (!move) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs flex-1"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
                  >
                    <span className="text-gray-700">—</span>
                  </div>
                );
              }
              const moveColor = move.type ? getTypeHex(move.type) : '#6b7280';
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs flex-1"
                  style={{
                    background: `linear-gradient(90deg, ${moveColor}22 0%, ${moveColor}08 100%)`,
                    border: `1px solid ${moveColor}33`,
                  }}
                >
                  {move.type && <TypeIcon type={move.type} size="xs" />}
                  {move.category && <MoveCategoryIcon category={move.category as MoveCategory} size={13} />}
                  {enableLinks && move.identifier ? (
                    <Link
                      href={`/data/moves/${move.identifier}`}
                      className="flex-1 font-semibold text-dark-text-primary truncate hover:text-yellow-500 transition-colors text-[11px]"
                    >
                      {move.name}
                    </Link>
                  ) : (
                    <span className="flex-1 font-semibold text-dark-text-primary truncate text-[11px]">{move.name}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: vertical stat column */}
          <div
            className="shrink-0 flex flex-col justify-between rounded-lg px-2.5 py-1.5"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', width: '96px' }}
          >
            {STAT_LABELS.map(({ key, label, color }) => {
              const base = pokemon?.pokemonData?.baseStats?.[key];
              const ev = (evs ?? defaultEv)[key];
              const iv = pokemon?.ivs?.[key] ?? 31;
              const level = pokemon?.level ?? 50;
              const calc = base != null
                ? calcStat(key, base, ev, iv, level, nature?.increasedStat, nature?.decreasedStat)
                : null;
              const isUp = nature?.increasedStat && NATURE_STAT_KEY[nature.increasedStat] === key;
              const isDown = nature?.decreasedStat && NATURE_STAT_KEY[nature.decreasedStat] === key;
              return (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-[9px] font-bold w-8 shrink-0 flex items-center gap-px" style={{ color }}>
                    {isUp && <span style={{ color: '#16a34a', fontSize: '8px' }}>▲</span>}
                    {isDown && <span style={{ color: '#dc2626', fontSize: '8px' }}>▼</span>}
                    {!isUp && !isDown && <span style={{ fontSize: '8px', opacity: 0 }}>▲</span>}
                    {label}
                  </span>
                  <span
                    className="text-[11px] font-mono font-bold w-7 text-right"
                    style={{ color: isUp ? '#16a34a' : isDown ? '#dc2626' : 'var(--color-text-primary)' }}
                  >
                    {calc ?? '—'}
                  </span>
                  <span className="text-[9px] font-mono font-semibold w-7 text-right leading-none" style={{ color: 'rgba(251,191,36,0.8)' }}>
                    {ev > 0 ? `+${ev}` : ''}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Remove button */}
        {showRemoveButton && onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-20 shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Slot Number */}
        {showSlotNumber && slotNumber !== undefined && (
          <div className="absolute bottom-2 left-2 w-5 h-5 bg-gray-700 text-white text-xs rounded-full flex items-center justify-center font-medium z-20 opacity-75">
            {slotNumber}
          </div>
        )}
      </div>
    );
  }

  // Compact variant
  return (
    <div className={className}>
      <div className="flex gap-2 mb-2">
        {pokemon?.pokemonData?.imageUrl ? (
          <img
            src={pokemon.pokemonData.imageUrl}
            alt={pokemon.pokemonData.name || 'Pokemon'}
            className="w-12 h-12 object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">?</span>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-bold text-sm text-gray-900 dark:text-dark-text-primary truncate text-left">
            {pokemon?.pokemonData?.name || 'Unknown'}
          </h3>
          {pokemon?.pokemonData?.types && pokemon.pokemonData.types.length > 0 && (
            <div className="flex gap-1 mt-1">
              {pokemon.pokemonData.types.map((type) => (
                <TypeIcon key={type} type={type} size="xs" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center mb-2 py-1 bg-white dark:bg-dark-bg-primary rounded h-8">
        {pokemon?.itemData?.spriteUrl && (
          <img src={pokemon.itemData.spriteUrl} alt={pokemon.itemData.name || 'Item'} title={pokemon.itemData.name} className="w-6 h-6 object-contain" />
        )}
      </div>

      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, index) => {
          const move = pokemon?.movesData?.[index];
          return (
            <div key={index} className="flex items-center gap-1.5 text-xs bg-white dark:bg-dark-bg-primary px-2 py-1 rounded">
              {move && move.type && move.name ? (
                <>
                  <TypeIcon type={move.type} size="xs" />
                  {move.category && <MoveCategoryIcon category={move.category as MoveCategory} size={16} />}
                  <span className="font-medium truncate flex-1 text-gray-800 dark:text-dark-text-primary">{move.name}</span>
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-600 flex-1">-</span>
              )}
            </div>
          );
        })}
      </div>

      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {showSlotNumber && slotNumber !== undefined && (
        <div className="absolute bottom-1 left-1 w-5 h-5 bg-gray-700 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {slotNumber}
        </div>
      )}
    </div>
  );
}
