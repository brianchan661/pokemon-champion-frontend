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

// Common EV spreads
const PRESET_SPREADS = [
  { name: 'Offensive', evs: { hp: 4, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 } },
  { name: 'Special Offensive', evs: { hp: 4, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 } },
  { name: 'Bulky Physical', evs: { hp: 252, attack: 252, defense: 4, specialAttack: 0, specialDefense: 0, speed: 0 } },
  { name: 'Bulky Special', evs: { hp: 252, attack: 0, defense: 0, specialAttack: 252, specialDefense: 4, speed: 0 } },
  { name: 'Tank', evs: { hp: 252, attack: 0, defense: 252, specialAttack: 0, specialDefense: 4, speed: 0 } },
];

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

  // Apply preset spread
  const applyPreset = (preset: StatSpread) => {
    onChange(preset);
  };

  // Reset all EVs
  const resetEVs = () => {
    onChange({
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* EV Counter */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          {t('teamBuilder.evs', 'EVs')}
        </span>
        <span className={`text-sm font-bold ${remainingEVs < 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {totalEVs} / 510
          {remainingEVs > 0 && (
            <span className="text-gray-500 ml-2">
              ({remainingEVs} {t('teamBuilder.remaining', 'remaining')})
            </span>
          )}
          {remainingEVs < 0 && (
            <span className="text-red-600 ml-2">
              ({Math.abs(remainingEVs)} {t('teamBuilder.over', 'over')})
            </span>
          )}
        </span>
      </div>

      {/* EV Inputs */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(STAT_LABELS) as Array<keyof StatSpread>).map((stat) => (
          <div key={stat} className="space-y-1">
            <label htmlFor={`ev-${stat}`} className="block text-sm font-medium text-gray-700">
              {STAT_LABELS[stat]}
            </label>
            <div className="relative">
              <input
                id={`ev-${stat}`}
                type="number"
                min="0"
                max="252"
                step="4"
                value={evs[stat]}
                onChange={(e) => handleChange(stat, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  evs[stat] > 252 ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {/* EV Bar */}
              <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    evs[stat] > 252 ? 'bg-red-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(100, (evs[stat] / 252) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          {t('teamBuilder.quickPresets', 'Quick Presets')}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SPREADS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.evs)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              {preset.name}
            </button>
          ))}
          <button
            onClick={resetEVs}
            className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            {t('teamBuilder.reset', 'Reset')}
          </button>
        </div>
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
