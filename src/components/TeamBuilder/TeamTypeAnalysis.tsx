import { useState } from 'react';
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
    const [hoveredCell, setHoveredCell] = useState<{ pokemonIndex: number; type: string } | null>(null);

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

            <div className="rounded-lg shadow-sm border overflow-hidden" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                <div className="overflow-x-auto" onMouseLeave={() => setHoveredCell(null)}>
                    <table className="w-full text-sm text-center border-collapse">
                        <thead>
                            <tr className="border-b" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                                <th className="p-3 text-left min-w-[150px] sticky left-0 z-10 border-r text-xs font-semibold text-dark-text-secondary uppercase tracking-wider" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
                                    {t('teamBuilder.pokemon', 'Pokemon')}
                                </th>
                                {TYPES.map((type) => (
                                    <th key={type} className={`p-2 min-w-[40px] border-r last:border-r-0 transition-colors duration-75 ${hoveredCell?.type === type
                                        ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-inset ring-blue-400 dark:ring-blue-500'
                                        : ''
                                        }`} style={{ borderColor: 'var(--color-border)' }}>
                                        <div className="flex flex-col items-center">
                                            <TypeIcon type={type} size="sm" />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody style={{ borderColor: 'var(--color-border)' }}>
                            {teamMembers.map((slot, index) => {
                                const pokemon = slot.pokemon!;
                                const moves = pokemon.movesData || [];
                                const isHoveredRow = hoveredCell?.pokemonIndex === index;

                                return (
                                    <tr key={`${pokemon.pokemonId}-${index}`} className="border-b transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                                        <td className={`p-3 text-left sticky left-0 z-10 border-r transition-colors duration-75 ${isHoveredRow
                                            ? '!bg-blue-100 dark:!bg-blue-900/30 ring-2 ring-inset ring-blue-400 dark:ring-blue-500'
                                            : ''
                                            }`} style={{ background: isHoveredRow ? undefined : 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
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
                                                moves.forEach(move => {
                                                    // Skip status moves for coverage calculation
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
                                                cellClass = 'bg-red-100 dark:bg-red-900/30';
                                                textClass = 'font-bold text-red-700 dark:text-red-400';
                                            } else if (maxEffectiveness >= 2) {
                                                content = '2×';
                                                cellClass = 'bg-orange-100 dark:bg-orange-900/30';
                                                textClass = 'font-bold text-orange-700 dark:text-orange-400';
                                            } else if (maxEffectiveness === 0) {
                                                content = '✕';
                                                cellClass = 'bg-gray-200 dark:bg-gray-700'; // Match DualTypeChart 0x style
                                                textClass = 'font-bold text-red-700 dark:text-red-400';
                                            } else if (maxEffectiveness <= 0.5 && maxEffectiveness > 0) {
                                                content = maxEffectiveness === 0.25 ? '¼' : '½';
                                                cellClass = 'bg-green-100 dark:bg-green-900/30'; // Match DualTypeChart resistant style
                                                textClass = 'text-green-700 dark:text-green-400';
                                            }

                                            // Highlighting logic
                                            const isHoveredCol = hoveredCell?.type === defType;
                                            const isHoveredCell = isHoveredRow && isHoveredCol;

                                            if (isHoveredCell) {
                                                cellClass = `ring-2 ring-inset ring-blue-500 z-20 ${cellClass || 'bg-blue-50 dark:bg-blue-900/30'}`;
                                            } else if (isHoveredRow || isHoveredCol) {
                                                cellClass = `${cellClass} opacity-80`;
                                                if (!cellClass.includes('bg-')) {
                                                    cellClass += ' bg-gray-100 dark:bg-white/5';
                                                }
                                            }

                                            return (
                                                <td
                                                    key={defType}
                                                    className={`p-1 border border-gray-50 dark:border-dark-border/30 ${cellClass} cursor-crosshair transition-colors duration-75`}
                                                    onMouseEnter={() => setHoveredCell({ pokemonIndex: index, type: defType })}
                                                >
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
