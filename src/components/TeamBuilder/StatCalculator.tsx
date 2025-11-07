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

  // Determine stat color based on range
  const getStatColor = (stat: keyof StatSpread, value: number): string => {
    if (stat === 'hp') {
      if (value >= 400) return 'text-green-600';
      if (value >= 300) return 'text-blue-600';
      if (value >= 200) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 200) return 'text-green-600';
      if (value >= 150) return 'text-blue-600';
      if (value >= 100) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700">
        {t('teamBuilder.finalStats', 'Final Stats')} (Lv. {level})
      </h3>

      <div className="space-y-2">
        {(Object.keys(STAT_LABELS) as Array<keyof StatSpread>).map((stat) => {
          const finalValue = finalStats[stat];
          const baseValue = baseStats[stat];
          const ev = evs[stat];
          const iv = ivs[stat];
          const isIncreased = nature?.increasedStat === stat || (stat !== 'hp' && nature?.increasedStat === `sp_${stat}`);
          const isDecreased = nature?.decreasedStat === stat || (stat !== 'hp' && nature?.decreasedStat === `sp_${stat}`);

          return (
            <div key={stat} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 w-20">
                  {STAT_LABELS[stat]}
                </span>
                {isIncreased && (
                  <span className="text-xs text-green-600" title="Increased by nature">
                    +
                  </span>
                )}
                {isDecreased && (
                  <span className="text-xs text-red-600" title="Decreased by nature">
                    -
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-gray-500">
                  <div>Base: {baseValue}</div>
                  <div className="flex gap-2">
                    <span>IV: {iv}</span>
                    <span>EV: {ev}</span>
                  </div>
                </div>

                <div className={`text-lg font-bold ${getStatColor(stat, finalValue)} min-w-[60px] text-right`}>
                  {finalValue}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stat Total */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
          <span className="text-sm font-bold text-gray-900">
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
