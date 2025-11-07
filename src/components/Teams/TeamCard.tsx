import Link from 'next/link';
import { memo } from 'react';
import { Team } from '@brianchan661/pokemon-champion-shared';
import { useTranslation } from 'next-i18next';
import { TypeIcon } from '@/components/UI';

interface TeamCardProps {
  team: Team;
  showAuthor?: boolean;
  className?: string;
}

/**
 * Reusable team card component for displaying team information
 * Used in team lists, search results, and user profiles
 */
export const TeamCard = memo(({ team, showAuthor = true, className = '' }: TeamCardProps) => {
  const { t } = useTranslation('common');

  return (
    <Link
      href={`/teams/${team.id}`}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden block ${className}`}
    >
      <div className="p-6 relative">
        {/* Author - Top Right */}
        {showAuthor && (
          <div className="absolute top-6 right-6">
            <p className="text-sm text-gray-600">
              {t('teams.by')} <span className="font-medium">{team.authorUsername || 'Unknown'}</span>
            </p>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-2 pr-32">
          {team.name}
        </h2>

        {/* Pokemon Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {team.pokemon.slice(0, 6).map((p, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              {/* Pokemon Header with Sprite and Item */}
              <div className="flex items-center gap-2 mb-2">
                {p.pokemonData?.imageUrl ? (
                  <img
                    src={p.pokemonData.imageUrl}
                    alt={p.pokemonData.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">
                    {p.pokemonData?.name || `Pokemon #${p.pokemonId}`}
                  </h3>
                  {p.pokemonData?.types && (
                    <div className="flex gap-1 mt-1">
                      {p.pokemonData.types.map((type: string) => (
                        <TypeIcon key={type} type={type} size="xs" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Item Sprite */}
              <div className="flex items-center justify-center mb-2 py-1 bg-white rounded h-8">
                {p.itemData?.spriteUrl && (
                  <img
                    src={p.itemData.spriteUrl}
                    alt={p.itemData.name}
                    title={p.itemData.name}
                    className="w-6 h-6 object-contain"
                  />
                )}
              </div>

              {/* Moves */}
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, index) => {
                  const move = p.movesData?.[index];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded"
                    >
                      {move ? (
                        <>
                          <TypeIcon type={move.type} size="xs" />
                          <span className="font-medium truncate flex-1 text-gray-800">
                            {move.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 flex-1">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {team.likes} {t('teams.likes')}
            </span>
          </div>
          <span className="text-sm text-primary-600 font-medium">
            {t('teams.viewDetails')} →
          </span>
        </div>
      </div>
    </Link>
  );
});

TeamCard.displayName = 'TeamCard';
