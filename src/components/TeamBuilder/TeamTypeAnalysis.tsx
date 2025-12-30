import { useTranslation } from 'next-i18next';
import { TeamSlot } from '@/components/TeamBuilder/TeamSlots';
import { TYPES, PokeType, getEffectiveness } from '@/data/typeChart';
import { TypeIcon } from '@/components/UI/TypeIcon';

interface TeamTypeAnalysisProps {
    team: TeamSlot[];
    className?: string;
}

export function TeamTypeAnalysis({ team, className = '' }: TeamTypeAnalysisProps) {
    const { t } = useTranslation('common');

    // Filter out empty slots for the table
    const teamMembers = team.filter((slot) => slot.pokemon && slot.pokemon.pokemonData);

    if (teamMembers.length === 0) {
        return null;
    }

    return (
        <div className={`mt-8 space-y-4 ${className}`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                {t('teamBuilder.typeCoverage', 'Offensive Type Coverage')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                {t('teamBuilder.typeCoverageDesc', 'See how effective your team\'s moves are against each type.')}
            </p>

            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-border">
                                <th className="p-3 text-left min-w-[150px] sticky left-0 z-10 bg-gray-50 dark:bg-dark-bg-tertiary border-r border-gray-200 dark:border-dark-border text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                                    {t('teamBuilder.pokemon', 'Pokemon')}
                                </th>
                                {TYPES.map((type) => (
                                    <th key={type} className="p-2 min-w-[40px] border-r border-gray-100 dark:border-dark-border/50 last:border-r-0">
                                        <div className="flex flex-col items-center">
                                            <TypeIcon type={type} size="sm" />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                            {teamMembers.map((slot, index) => {
                                const pokemon = slot.pokemon!;
                                const moves = pokemon.movesData || [];

                                return (
                                    <tr key={`${pokemon.pokemonId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary/50 transition-colors">
                                        <td className="p-3 text-left sticky left-0 z-10 bg-white dark:bg-dark-bg-secondary border-r border-gray-200 dark:border-dark-border group-hover:bg-gray-50 dark:group-hover:bg-dark-bg-tertiary/50">
                                            <div className="flex items-center gap-2">
                                                {pokemon.pokemonData?.imageUrl && (
                                                    <img
                                                        src={pokemon.pokemonData.imageUrl}
                                                        alt={pokemon.pokemonData.name}
                                                        className="w-8 h-8 object-contain"
                                                    />
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-dark-text-primary truncate max-w-[120px]">
                                                    {pokemon.pokemonData?.name}
                                                </span>
                                            </div>
                                        </td>

                                        {TYPES.map((defType) => {
                                            // Calculate max effectiveness for this Pokemon against defType
                                            let maxEffectiveness = 0;

                                            // Also consider that damaging moves might be 0 if no moves selected, but logic handles it
                                            if (moves.length === 0) {
                                                // If no moves, effectiveness is 0 (or just show nothing)
                                                maxEffectiveness = 0;
                                            } else {
                                                // Find the move that deals the most damage multiplier
                                                // Note: actual damage depends on stats, but charts usually just check type matchup multiplier

                                                // We need to iterate all moves and check their type
                                                moves.forEach(move => {
                                                    // Skip status moves for coverage calculation usually? 
                                                    // The user's request "show which type of enemy they are effective to" usually implies attacking moves.
                                                    // status moves have category 'status'.
                                                    if (move.category === 'status') return;

                                                    // Normalize type casing (capitalize first letter, rest lowercase)
                                                    const rawType = move.type;
                                                    const moveType = (rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()) as PokeType;

                                                    if (TYPES.includes(moveType)) {
                                                        const eff = getEffectiveness(moveType, defType);
                                                        if (eff > maxEffectiveness) {
                                                            maxEffectiveness = eff;
                                                        }
                                                    }
                                                });
                                            }

                                            // Determine cell content and style
                                            let content = '';
                                            let cellClass = '';
                                            let textClass = 'text-gray-400 dark:text-dark-text-tertiary';

                                            if (maxEffectiveness >= 4) {
                                                content = '4×';
                                                cellClass = 'bg-green-100 dark:bg-green-900/30';
                                                textClass = 'font-bold text-green-700 dark:text-green-400';
                                            } else if (maxEffectiveness >= 2) {
                                                content = '2×';
                                                cellClass = 'bg-green-50 dark:bg-green-900/10';
                                                textClass = 'font-bold text-green-600 dark:text-green-500';
                                            } else if (maxEffectiveness === 0) {
                                                content = '✕';
                                                cellClass = 'bg-gray-50 dark:bg-dark-bg-tertiary/50';
                                                textClass = 'font-bold text-red-500 dark:text-red-400';
                                            } else {
                                                // 1x, 0.5x, etc. - usually we only highlight super effective for offensive coverage
                                                // Showing everything can be cluttered. 
                                                // But for a full matrix, empty cells for neutral might be cleaner?
                                                // "show which type of enemy they are effective to" -> Focus on effectiveness.
                                                // Let's hide neutral/not very effective to reduce noise, or just show numbers lightly.
                                                // Let's match the user's implicit "effective to" and the reference chart style.
                                                // Reference chart shows everything.
                                                // But for "Offensive", usually you care about coverage (Supereffective).
                                                // Let's show 2x and 4x clearly, maybe dampen the rest.

                                                if (maxEffectiveness === 1) {
                                                    content = '';
                                                } else if (maxEffectiveness < 1 && maxEffectiveness > 0) {
                                                    // Resisted
                                                    content = '½';
                                                    if (maxEffectiveness === 0.25) content = '¼';
                                                    textClass = 'text-red-400 dark:text-red-300/80 text-[10px]'; // De-emphasize resisted but ensure visible
                                                }
                                            }

                                            return (
                                                <td key={defType} className={`p-1 border-r border-gray-50 dark:border-dark-border/30 last:border-r-0 ${cellClass}`}>
                                                    <span className={textClass}>{content}</span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
