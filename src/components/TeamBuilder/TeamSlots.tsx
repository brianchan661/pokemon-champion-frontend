import { useTranslation } from 'next-i18next';
import { TeamPokemon } from '@brianchan661/pokemon-champion-shared';
import { PokemonCard } from '@/components/UI';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTeamSlot } from './SortableTeamSlot';

export interface TeamSlot {
  id: string;
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
  onTeamUpdate: (newTeam: TeamSlot[]) => void;
  activeSlot?: number;
  className?: string;
}

/**
 * 6-slot team display component
 * Shows Pokemon sprites or empty slots
 * Supports drag and drop reordering
 */
export function TeamSlots({
  team,
  onSlotClick,
  onRemovePokemon,
  onTeamUpdate,
  activeSlot,
  className = ''
}: TeamSlotsProps) {
  const { t } = useTranslation('common');

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = team.findIndex((slot) => slot.id === active.id);
      const newIndex = team.findIndex((slot) => slot.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onTeamUpdate(arrayMove(team, oldIndex, newIndex));
      }
    }
  };

  // Ensure we usually have 6 slots, though the parent manages state now
  // Assuming 'team' passed in has IDs and length 6 handled by parent.

  return (
    <div className={`bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-4">
        {t('teamBuilder.yourTeam', 'Your Team')} ({team.filter(s => s.pokemon).length}/6)
      </h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={team.map(s => s.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((slot, index) => {
              const isEmpty = !slot.pokemon;
              const isActive = activeSlot === index;
              const pokemon = slot.pokemon;

              return (
                <SortableTeamSlot key={slot.id} id={slot.id}>
                  <div
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
                      <div className="w-full h-full p-4 bg-gray-50 dark:bg-dark-bg-tertiary flex flex-col relative text-left group">
                        {/* Make the card clickable for editing, but notice Sortable might interfere if we don't use a drag handle or if the whole thing is the handle. 
                         By default, setting ref on the container makes the whole container draggable. 
                         But we also need to click to edit. dnd-kit pointer sensor usually distinguishes click vs drag (movement).
                         We should ensure the click propagates if not dragging. */}
                        <div onClick={() => onSlotClick(index)} className="cursor-pointer h-full">
                          <PokemonCard
                            pokemon={pokemon}
                            variant="detailed"
                            showRemoveButton={true}
                            onRemove={(e) => {
                              e.stopPropagation();
                              // Prevent drag start on remove button? remove button handles stopPropagation itself usually.
                              onRemovePokemon(index);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </SortableTeamSlot>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
