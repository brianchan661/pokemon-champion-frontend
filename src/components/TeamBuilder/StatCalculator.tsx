import { useTranslation } from 'next-i18next';
import { StatSpread } from '@brianchan661/pokemon-champion-shared';
import { calculateAllStats } from '@/utils/calculateStats';
import { Nature } from '@/services/naturesService';

interface StatCalculatorProps {
  baseStats: StatSpread;
  ivs: StatSpread;
  evs: StatSpread;
  level: number;
  nature: Nature | null;
  className?: string;
}

const STAT_LABELS = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp. Atk',
  specialDefense: 'Sp. Def',
  speed: 'Speed',
};

const NATURE_STAT_MAP: Record<string, string> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  specialAttack: 'sp_atk',
  specialDefense: 'sp_def',
  speed: 'speed',
};

/**
 * Live stat calculator display
 * Shows final calculated stats with color coding
 */
export function StatCalculator({ baseStats, ivs, evs, level, nature, className = '' }: StatCalculatorProps) {
  const { t } = useTranslation('common');

  // Get nature modifiers
  const natureModifiers = {
    attack: nature?.increasedStat === 'attack' ? 1.1 : nature?.decreasedStat === 'attack' ? 0.9 : 1.0,
    defense: nature?.increasedStat === 'defense' ? 1.1 : nature?.decreasedStat === 'defense' ? 0.9 : 1.0,
    specialAttack: nature?.increasedStat === 'sp_atk' ? 1.1 : nature?.decreasedStat === 'sp_atk' ? 0.9 : 1.0,
    specialDefense: nature?.increasedStat === 'sp_def' ? 1.1 : nature?.decreasedStat === 'sp_def' ? 0.9 : 1.0,
    speed: nature?.increasedStat === 'speed' ? 1.1 : nature?.decreasedStat === 'speed' ? 0.9 : 1.0,
  };

  // Calculate final stats
  const finalStats = calculateAllStats(baseStats, ivs, evs, level, natureModifiers);



  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
        {t('teamBuilder.finalStats', 'Final Stats')} (Lv. {level})
      </h3>

      <div className="space-y-1">
        {(Object.keys(STAT_LABELS) as Array<keyof StatSpread>).map((stat) => {
          const finalValue = finalStats[stat];
          const baseValue = baseStats[stat];
          const ev = evs[stat];
          const iv = ivs[stat];
          const natureStat = NATURE_STAT_MAP[stat];
          const isIncreased = nature?.increasedStat === natureStat;
          const isDecreased = nature?.decreasedStat === natureStat;

          return (
            <div key={stat} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary rounded transition-colors group">
              <div className="flex items-center gap-1.5 min-w-[30%]">
                <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary w-14 truncate">
                  {STAT_LABELS[stat]}
                </span>
                <div className="flex flex-col w-2 leading-none">
                  {isIncreased && (
                    <span className="text-[10px] text-green-600 font-bold" title="Increased by nature">
                      ▲
                    </span>
                  )}
                  {isDecreased && (
                    <span className="text-[10px] text-red-600 font-bold" title="Decreased by nature">
                      ▼
                    </span>
                  )}
                </div>
              </div>

              {/* Compact details for hover/always if space permits */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                <div className="text-[10px] text-gray-400 dark:text-dark-text-tertiary hidden group-hover:flex gap-1.5">
                  <span>B:{baseValue}</span>
                  <span>I:{iv}</span>
                  <span>E:{ev}</span>
                </div>

                <div className="text-sm font-bold text-gray-900 dark:text-dark-text-primary min-w-[30px] text-right">
                  {finalValue}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stat Total */}
      <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between p-2 bg-primary-50 dark:bg-dark-bg-tertiary rounded-lg">
          <span className="text-sm font-bold text-gray-900 dark:text-dark-text-primary">
            {t('teamBuilder.statTotal', 'Stat Total')}
          </span>
          <span className="text-lg font-bold text-primary-600">
            {Object.values(finalStats).reduce((sum, val) => sum + val, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
