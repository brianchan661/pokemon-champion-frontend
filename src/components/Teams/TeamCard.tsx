import Link from 'next/link';
import { memo } from 'react';
import { Team } from '@brianchan661/pokemon-champion-shared';
import { useTranslation } from 'next-i18next';
import { PokemonCard } from '@/components/UI';

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
      className={`bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden block border border-gray-200 dark:border-dark-border ${className}`}
    >
      <div className="p-6 relative">
        {/* Author - Top Right */}
        {showAuthor && (
          <div className="absolute top-6 right-6">
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {t('teams.by')} <span className="font-medium dark:text-dark-text-primary">{team.authorUsername || 'Unknown'}</span>
            </p>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-2 pr-32">
          {team.name}
        </h2>

        {/* Pokemon Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {team.pokemon.slice(0, 6).map((p, index) => (
            <PokemonCard
              key={index}
              pokemon={p}
              className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-3 border border-gray-200 dark:border-dark-border"
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center text-sm text-gray-600 dark:text-dark-text-secondary">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              {team.likes} {t('teams.likes')}
            </span>
          </div>
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {t('teams.viewDetails')} →
          </span>
        </div>
      </div>
    </Link>
  );
});

TeamCard.displayName = 'TeamCard';
