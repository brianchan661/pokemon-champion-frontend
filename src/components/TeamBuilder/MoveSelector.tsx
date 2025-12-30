import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { movesService, Move } from '@/services/movesService';
import { MoveCategoryIcon } from '@/components/UI/MoveCategoryIcon';
import { TypeIcon } from '@/components/UI';

interface MoveSelectorProps {
  selectedMoveIds: number[];
  onMoveSelect: (moveId: number) => void;
  onMoveRemove: (moveId: number) => void;
  availableMoveNames?: string[]; // Optional: restrict to Pokemon's available moves
  initialMoves?: Move[];
  className?: string;
}

/**
 * Searchable move selector with up to 4 moves
 */
export function MoveSelector({ selectedMoveIds, onMoveSelect, onMoveRemove, availableMoveNames, initialMoves = [], className = '' }: MoveSelectorProps) {
  const { t } = useTranslation('common');
  const [allMoves, setAllMoves] = useState<Move[]>(initialMoves);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'' | 'physical' | 'special' | 'status'>('');
  const [isOpen, setIsOpen] = useState(false);

  // Lazy load moves when dropdown opens
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadMoves();
    }
  }, [isOpen, hasLoaded]);

  async function loadMoves() {
    setLoading(true);
    const result = await movesService.getMoves({ pageSize: 1000 });

    if (result.success && result.data) {
      setAllMoves(result.data.moves);
      setHasLoaded(true);
    }
    setLoading(false);
  }

  // Filter moves based on Pokemon's available moves
  const moves = useMemo(() => {
    if (!availableMoveNames || availableMoveNames.length === 0) {
      return allMoves; // Show all moves if no restriction
    }
    // Filter to only show moves the Pokemon can learn
    return allMoves.filter(move => availableMoveNames.includes(move.name));
  }, [allMoves, availableMoveNames]);

  // Filter moves
  const filteredMoves = useMemo(() => {
    return moves.filter((move) => {
      const matchesSearch = !searchQuery || move.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !typeFilter || move.type === typeFilter;
      const matchesCategory = !categoryFilter || move.category === categoryFilter;
      const notSelected = !selectedMoveIds.includes(move.id);

      return matchesSearch && matchesType && matchesCategory && notSelected;
    });
  }, [moves, searchQuery, typeFilter, categoryFilter, selectedMoveIds]);

  // Get selected moves
  const selectedMoves = moves.filter((m) => selectedMoveIds.includes(m.id));

  // Handle move selection
  const handleSelect = (moveId: number) => {
    if (selectedMoveIds.length < 4) {
      onMoveSelect(moveId);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={className}>
      {/* Selected Moves */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
            {t('teamBuilder.moves', 'Moves')} ({selectedMoveIds.length}/4)
          </label>
        </div>

        <div className="space-y-2">
          {Array(4).fill(null).map((_, index) => {
            const move = selectedMoves[index];

            if (!move) {
              return (
                <button
                  key={index}
                  onClick={() => setIsOpen(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-colors text-sm dark:border-dark-border dark:text-dark-text-tertiary dark:hover:border-primary-500 dark:hover:text-primary-400"
                  disabled={selectedMoveIds.length < index}
                >
                  {selectedMoveIds.length === index ? t('teamBuilder.selectMove', 'Select Move') : '-'}
                </button>
              );
            }

            return (
              <div
                key={move.id}
                className="relative p-3 border border-gray-200 rounded-lg bg-white dark:bg-dark-bg-tertiary dark:border-dark-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={20} />
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">{move.name}</span>
                      <TypeIcon type={move.type} size="sm" />
                    </div>
                    <div className="flex gap-3 text-xs text-gray-600 dark:text-dark-text-secondary">
                      {move.power && <span>Power: {move.power}</span>}
                      {move.accuracy && <span>Acc: {move.accuracy}%</span>}
                      <span>PP: {move.pp}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onMoveRemove(move.id)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Move Selector Modal/Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary">
                  {t('teamBuilder.selectMove', 'Select Move')}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-dark-text-tertiary dark:hover:text-dark-text-secondary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder={t('teamBuilder.searchMoves', 'Search moves...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3 dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-dark-text-primary dark:placeholder-dark-text-tertiary"
              />

              {/* Filters */}
              <div className="flex gap-2 mb-3">
                {(['physical', 'special', 'status'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${categoryFilter === cat
                      ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500 dark:text-primary-400'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-dark-bg-tertiary dark:border-dark-border dark:text-dark-text-secondary dark:hover:bg-dark-bg-secondary'
                      }`}
                  >
                    <MoveCategoryIcon category={cat} size={16} />
                    <span className="capitalize">{t(`teamBuilder.${cat}`, cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Moves List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-center text-gray-500 py-8 dark:text-dark-text-tertiary">{t('common.loading', 'Loading...')}</p>
              ) : filteredMoves.length === 0 ? (
                <p className="text-center text-gray-500 py-8 dark:text-dark-text-tertiary">
                  {t('teamBuilder.noMovesFound', 'No moves found')}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredMoves.map((move) => (
                    <button
                      key={move.id}
                      onClick={() => handleSelect(move.id)}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left dark:border-dark-border dark:bg-dark-bg-primary dark:hover:bg-dark-bg-tertiary dark:hover:border-primary-500"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={20} />
                        <span className="font-medium text-gray-900 dark:text-dark-text-primary">{move.name}</span>
                        <TypeIcon type={move.type} size="sm" />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-600 dark:text-dark-text-secondary">
                        {move.power && <span>Power: {move.power}</span>}
                        {move.accuracy && <span>Accuracy: {move.accuracy}%</span>}
                        <span>PP: {move.pp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
