import { useTranslation } from 'next-i18next';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { StatSpread } from '@brianchan661/pokemon-champion-shared';
import { calculateAllStats } from '@/utils/calculateStats';
import { Nature } from '@/services/naturesService';
import { EV_MAX_PER_STAT, EV_MAX_TOTAL } from '@/utils/calculateStats';

interface EVInputsProps {
  evs: StatSpread;
  onChange: (evs: StatSpread) => void;
  baseStats: StatSpread;
  ivs: StatSpread;
  level: number;
  nature: Nature | null;
  className?: string;
}

const STAT_ACCENT: Record<keyof StatSpread, string> = {
  hp:             '#ef4444',
  attack:         '#f97316',
  defense:        '#eab308',
  specialAttack:  '#3b82f6',
  specialDefense: '#22c55e',
  speed:          '#ec4899',
};

const NATURE_STAT_MAP: Record<string, string> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  specialAttack: 'sp_atk',
  specialDefense: 'sp_def',
  speed: 'speed',
};

const STATS: Array<keyof StatSpread> = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];

export function EVInputs({ evs, onChange, baseStats, ivs, level, nature, className = '' }: EVInputsProps) {
  const { t } = useTranslation('common');

  const totalEVs = Object.values(evs).reduce((sum, val) => sum + val, 0);
  const remaining = EV_MAX_TOTAL - totalEVs;
  const isOverCap = totalEVs > EV_MAX_TOTAL;

  const natureModifiers = {
    attack:         nature?.increasedStat === 'attack'  ? 1.1 : nature?.decreasedStat === 'attack'  ? 0.9 : 1.0,
    defense:        nature?.increasedStat === 'defense' ? 1.1 : nature?.decreasedStat === 'defense' ? 0.9 : 1.0,
    specialAttack:  nature?.increasedStat === 'sp_atk'  ? 1.1 : nature?.decreasedStat === 'sp_atk'  ? 0.9 : 1.0,
    specialDefense: nature?.increasedStat === 'sp_def'  ? 1.1 : nature?.decreasedStat === 'sp_def'  ? 0.9 : 1.0,
    speed:          nature?.increasedStat === 'speed'   ? 1.1 : nature?.decreasedStat === 'speed'   ? 0.9 : 1.0,
  };

  const finalStats = calculateAllStats(baseStats, ivs, evs, level, natureModifiers);

  const setEV = (stat: keyof StatSpread, value: number) => {
    const clamped = Math.max(0, Math.min(EV_MAX_PER_STAT, value));
    const newEvs = { ...evs, [stat]: clamped };
    const newTotal = Object.values(newEvs).reduce((sum, v) => sum + v, 0);
    if (newTotal <= EV_MAX_TOTAL || clamped < evs[stat]) {
      onChange(newEvs);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
          {t('teamBuilder.evs', 'EVs')}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
          isOverCap
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : remaining === 0
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary'
        }`}>
          {totalEVs}/{EV_MAX_TOTAL}
        </span>
      </div>

      {/* Stat rows */}
      <div className="space-y-2">
        {STATS.map((stat) => {
          const natureStat = NATURE_STAT_MAP[stat];
          const isIncreased = nature?.increasedStat === natureStat;
          const isDecreased = nature?.decreasedStat === natureStat;
          const ev = evs[stat];
          const accent = STAT_ACCENT[stat];
          const canIncrease = ev < EV_MAX_PER_STAT && remaining > 0;

          return (
            <div key={stat} className="space-y-1">
              {/* Top row: name + final stat + ev counter */}
              <div className="flex items-center gap-2">
                {/* Stat name */}
                <div className="w-16 flex items-center gap-0.5 flex-shrink-0">
                  <span className={`text-xs font-semibold truncate ${
                    isIncreased ? 'text-red-500 dark:text-red-400' :
                    isDecreased ? 'text-blue-500 dark:text-blue-400' :
                    'text-gray-600 dark:text-dark-text-secondary'
                  }`}>
                    {t(`teamBuilder.statLabels.${stat}`)}
                  </span>
                  {isIncreased && <ArrowUp className="w-3 h-3 text-red-500 flex-shrink-0" />}
                  {isDecreased && <ArrowDown className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                </div>

                {/* Final stat value */}
                <span className={`w-9 text-sm font-bold tabular-nums text-right flex-shrink-0 ${
                  isIncreased ? 'text-red-500 dark:text-red-400' :
                  isDecreased ? 'text-blue-500 dark:text-blue-400' :
                  'text-gray-800 dark:text-dark-text-primary'
                }`}>
                  {finalStats[stat]}
                </span>

                {/* − button */}
                <button
                  type="button"
                  onClick={() => setEV(stat, ev - 1)}
                  disabled={ev <= 0}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-dark-bg-tertiary text-gray-500 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-primary disabled:opacity-25 transition-colors flex-shrink-0 text-sm font-bold leading-none"
                >
                  −
                </button>

                {/* EV number */}
                <span className={`w-5 text-xs font-bold tabular-nums text-center flex-shrink-0 ${
                  ev > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-300 dark:text-dark-text-tertiary'
                }`}>
                  {ev}
                </span>

                {/* + button */}
                <button
                  type="button"
                  onClick={() => setEV(stat, ev + 1)}
                  disabled={!canIncrease}
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-dark-bg-tertiary text-gray-500 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-primary disabled:opacity-25 transition-colors flex-shrink-0 text-sm font-bold leading-none"
                >
                  +
                </button>
              </div>

              {/* Slider row */}
              <div className="flex items-center gap-2 pl-16">
                <div className="relative flex-1 h-3 flex items-center">
                  {/* Track background */}
                  <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-600" />
                  {/* Fill */}
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-150"
                    style={{
                      width: `${(ev / EV_MAX_PER_STAT) * 100}%`,
                      backgroundColor: accent,
                      opacity: ev > 0 ? 1 : 0,
                    }}
                  />
                  {/* Native range input (transparent, on top) */}
                  <input
                    type="range"
                    min={0}
                    max={EV_MAX_PER_STAT}
                    value={ev}
                    onChange={(e) => setEV(stat, parseInt(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    style={{ '--accent': accent } as React.CSSProperties}
                  />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-dark-text-tertiary w-5 text-right flex-shrink-0 tabular-nums">
                  {EV_MAX_PER_STAT}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isOverCap && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium">
          {t('teamBuilder.evError', `Total cannot exceed ${EV_MAX_TOTAL}`)}
        </p>
      )}
    </div>
  );
}
