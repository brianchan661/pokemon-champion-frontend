import { useTranslation } from 'next-i18next';
import { TeamPokemon } from '@brianchan661/pokemon-champion-shared';

export interface TeamSlot {
  pokemon?: TeamPokemon & {
    pokemonData: {
      id: number;
      nationalNumber: string;
      name: string;
      imageUrl?: string;
      types: string[];
    };
  };
}

interface TeamSlotsProps {
  team: TeamSlot[];
  onSlotClick: (index: number) => void;
  onRemovePokemon: (index: number) => void;
  activeSlot?: number;
  className?: string;
}

/**
 * 6-slot team display component
 * Shows Pokemon sprites or empty slots
 */
export function TeamSlots({ team, onSlotClick, onRemovePokemon, activeSlot, className = '' }: TeamSlotsProps) {
  const { t } = useTranslation('common');

  // Ensure we always have 6 slots
  const slots: TeamSlot[] = Array(6).fill(null).map((_, index) => team[index] || {});

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {t('teamBuilder.yourTeam', 'Your Team')} ({team.filter(s => s.pokemon).length}/6)
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot, index) => {
          const isEmpty = !slot.pokemon;
          const isActive = activeSlot === index;

          return (
            <div
              key={index}
              className={`relative aspect-square rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : isEmpty
                  ? 'border-dashed border-gray-300 hover:border-primary-400'
                  : 'border-gray-200 hover:border-primary-400'
              }`}
            >
              {isEmpty ? (
                <button
                  onClick={() => onSlotClick(index)}
                  className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">
                    {t('teamBuilder.addPokemon', 'Add Pokemon')}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => onSlotClick(index)}
                  className="w-full h-full p-3 flex flex-col items-center justify-center"
                >
                  {/* Pokemon Image */}
                  <div className="w-full flex-1 flex items-center justify-center mb-2">
                    {slot.pokemon?.pokemonData?.imageUrl ? (
                      <img
                        src={slot.pokemon.pokemonData.imageUrl}
                        alt={slot.pokemon.pokemonData.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-400">?</span>
                      </div>
                    )}
                  </div>

                  {/* Pokemon Name */}
                  <div className="text-center w-full">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {slot.pokemon?.pokemonData?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Lv. {slot.pokemon?.level || 50}
                    </p>
                  </div>

                  {/* Types */}
                  <div className="flex gap-1 mt-1">
                    {slot.pokemon?.pokemonData?.types?.slice(0, 2).map((type) => (
                      <span
                        key={type}
                        className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePokemon(index);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    title={t('teamBuilder.remove', 'Remove')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Slot Number */}
                  <div className="absolute bottom-1 left-1 w-5 h-5 bg-gray-700 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
