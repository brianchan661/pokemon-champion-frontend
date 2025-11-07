import { useTranslation } from 'next-i18next';
import { TeamSlot } from './TeamSlots';
import { TypeIcon } from '@/components/UI';

interface TeamSummaryProps {
  team: TeamSlot[];
  teamName?: string;
  teamDescription?: string;
  className?: string;
}

/**
 * Team overview and summary component
 * Shows team composition and type coverage
 */
export function TeamSummary({ team, teamName, teamDescription, className = '' }: TeamSummaryProps) {
  const { t } = useTranslation('common');

  // Get all types from team
  const teamTypes = team
    .filter((slot) => slot.pokemon)
    .flatMap((slot) => slot.pokemon!.pokemonData.types);

  // Count type occurrences
  const typeCounts = teamTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate team stats
  const teamSize = team.filter((slot) => slot.pokemon).length;
  const avgLevel = teamSize > 0
    ? Math.round(team
        .filter((slot) => slot.pokemon)
        .reduce((sum, slot) => sum + slot.pokemon!.level, 0) / teamSize)
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('teamBuilder.teamSummary', 'Team Summary')}
        </h3>

        {/* Team Name & Description */}
        {teamName && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900">{teamName}</h4>
            {teamDescription && (
              <p className="text-sm text-gray-600 mt-1">{teamDescription}</p>
            )}
          </div>
        )}

        {/* Team Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{t('teamBuilder.teamSize', 'Team Size')}</span>
            <span className="font-semibold text-gray-900">{teamSize} / 6</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{t('teamBuilder.avgLevel', 'Average Level')}</span>
            <span className="font-semibold text-gray-900">Lv. {avgLevel}</span>
          </div>
        </div>

        {/* Type Distribution */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {t('teamBuilder.typeDistribution', 'Type Distribution')}
            </h4>
            <div className="space-y-2">
              {Object.entries(typeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 w-20">{type}</span>
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${(count / teamSize) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Team Members List */}
        {teamSize > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {t('teamBuilder.members', 'Members')}
            </h4>
            <div className="space-y-2">
              {team.filter((slot) => slot.pokemon).map((slot, index) => {
                const pokemon = slot.pokemon!;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {pokemon.pokemonData.imageUrl && (
                      <img
                        src={pokemon.pokemonData.imageUrl}
                        alt={pokemon.pokemonData.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {pokemon.pokemonData.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Lv. {pokemon.level}</span>
                        <span>•</span>
                        <div className="flex gap-1">
                          {pokemon.pokemonData.types.map((type) => (
                            <TypeIcon key={type} type={type} size="xs" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {teamSize === 0 && (
          <div className="text-center py-8">
            <svg
              className="mx-auto w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-gray-500 text-sm">
              {t('teamBuilder.noTeamMembers', 'No team members yet')}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {t('teamBuilder.addPokemonToStart', 'Add Pokemon to get started')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
