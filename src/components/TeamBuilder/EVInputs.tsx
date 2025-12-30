import { useTranslation } from 'next-i18next';
import { StatSpread } from '@brianchan661/pokemon-champion-shared';

interface EVInputsProps {
  evs: StatSpread;
  onChange: (evs: StatSpread) => void;
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
 * EV input component with validation and presets
 */
export function EVInputs({ evs, onChange, className = '' }: EVInputsProps) {
  const { t } = useTranslation('common');

  // Calculate total EVs
  const totalEVs = Object.values(evs).reduce((sum, val) => sum + val, 0);
  const remainingEVs = 510 - totalEVs;

  // Handle EV change for a specific stat
  const handleChange = (stat: keyof StatSpread, value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(252, numValue));

    onChange({
      ...evs,
      [stat]: clampedValue,
    });
  };





  return (
    <div className={`space-y-4 ${className}`}>
      {/* EV and Total Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
          {t('teamBuilder.evs', 'EVs')}
        </span>
        <span className={`text-xs font-bold ${remainingEVs < 0 ? 'text-red-600' : 'text-gray-500 dark:text-dark-text-tertiary'}`}>
          {totalEVs}/510
          {remainingEVs < 0 && (
            <span className="text-red-600 ml-1">
              ({remainingEVs})
            </span>
          )}
        </span>
      </div>

      {/* Compact EV Inputs - Single Column for side panel */}
      <div className="space-y-2">
        {(Object.keys(STAT_LABELS) as Array<keyof StatSpread>).map((stat) => (
          <div key={stat} className="grid grid-cols-12 gap-2 items-center">
            <label htmlFor={`ev-${stat}`} className="col-span-3 text-xs font-medium text-gray-600 dark:text-dark-text-secondary truncate">
              {STAT_LABELS[stat]}
            </label>
            <div className="col-span-9 relative flex gap-1">
              <div className="relative flex-1">
                <input
                  id={`ev-${stat}`}
                  type="number"
                  min="0"
                  max="252"
                  step="4"
                  value={evs[stat]}
                  onChange={(e) => handleChange(stat, e.target.value)}
                  className={`w-full px-2 py-1 text-sm border rounded hover:border-primary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-dark-text-primary ${evs[stat] > 252 ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-dark-bg-primary rounded-full overflow-hidden mx-0.5 mb-px">
                  <div
                    className={`h-full transition-all ${evs[stat] > 252 ? 'bg-red-500' : 'bg-primary-500'
                      }`}
                    style={{ width: `${Math.min(100, (evs[stat] / 252) * 100)}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange(stat, '252')}
                className="px-1.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors dark:bg-dark-bg-tertiary dark:text-dark-text-secondary dark:hover:bg-dark-bg-primary"
                title="Max (252)"
              >
                Max
              </button>
              <button
                type="button"
                onClick={() => handleChange(stat, '0')}
                className="px-1.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded transition-colors dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30"
                title="Reset (0)"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>



      {/* Validation Error */}
      {totalEVs > 510 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {t('teamBuilder.evError', 'Total EVs cannot exceed 510')}
          </p>
        </div>
      )}
    </div>
  );
}
