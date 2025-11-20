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
    <div className={`bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-4">
        {t('teamBuilder.yourTeam', 'Your Team')} ({team.filter(s => s.pokemon).length}/6)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot, index) => {
          const isEmpty = !slot.pokemon;
          const isActive = activeSlot === index;
          const pokemon = slot.pokemon;

          return (
            <div
              key={index}
              className={`relative rounded-lg border-2 transition-all h-full ${isActive
                ? 'border-primary-500 ring-2 ring-primary-200'
                : isEmpty
                  ? 'border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-400'
                  : 'border-gray-200 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-400'
                }`}
            >
              {isEmpty ? (
                <button
                  onClick={() => onSlotClick(index)}
                  className="w-full h-full p-8 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                  className="w-full h-full p-4 bg-gray-50 dark:bg-dark-bg-tertiary flex flex-col relative text-left"
                >
                  <PokemonCard
                    pokemon={pokemon}
                    variant="detailed"
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
