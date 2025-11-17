import { useTranslation } from 'next-i18next';
import { TeamPokemon } from '@brianchan661/pokemon-champion-shared';
import { PokemonCard } from '@/components/UI';

export interface TeamSlot {
  pokemon?: TeamPokemon & {
    pokemonData: {
      id: number;
      nationalNumber: number;
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
          const pokemon = slot.pokemon;

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
                  className="w-full h-full p-3 bg-gray-50 flex flex-col relative"
                >
                  <PokemonCard
                    pokemon={pokemon}
                    showRemoveButton={true}
                    onRemove={(e) => {
                      e.stopPropagation();
                      onRemovePokemon(index);
                    }}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
