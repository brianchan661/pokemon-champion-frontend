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
  className?: string;
}

/**
 * Searchable move selector with up to 4 moves
 */
export function MoveSelector({ selectedMoveIds, onMoveSelect, onMoveRemove, availableMoveNames, className = '' }: MoveSelectorProps) {
  const { t } = useTranslation('common');
  const [allMoves, setAllMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'' | 'physical' | 'special' | 'status'>('');
  const [isOpen, setIsOpen] = useState(false);

  // Lazy load moves when dropdown opens
  useEffect(() => {
    if (isOpen && allMoves.length === 0) {
      loadMoves();
    }
  }, [isOpen]);

  async function loadMoves() {
    setLoading(true);
    const result = await movesService.getMoves({ pageSize: 1000 });

    if (result.success && result.data) {
      setAllMoves(result.data.moves);
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
          <label className="block text-sm font-medium text-gray-700">
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
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-colors text-sm"
                  disabled={selectedMoveIds.length < index}
                >
                  {selectedMoveIds.length === index ? t('teamBuilder.selectMove', 'Select Move') : '-'}
                </button>
              );
            }

            return (
              <div
                key={move.id}
                className="relative p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={20} />
                      <span className="font-medium text-gray-900">{move.name}</span>
                      <TypeIcon type={move.type} size="sm" />
                    </div>
                    <div className="flex gap-3 text-xs text-gray-600">
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {t('teamBuilder.selectMove', 'Select Move')}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
              />

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">{t('teamBuilder.allCategories', 'All Categories')}</option>
                  <option value="physical">{t('teamBuilder.physical', 'Physical')}</option>
                  <option value="special">{t('teamBuilder.special', 'Special')}</option>
                  <option value="status">{t('teamBuilder.status', 'Status')}</option>
                </select>
              </div>
            </div>

            {/* Moves List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-center text-gray-500 py-8">{t('common.loading', 'Loading...')}</p>
              ) : filteredMoves.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {t('teamBuilder.noMovesFound', 'No moves found')}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredMoves.map((move) => (
                    <button
                      key={move.id}
                      onClick={() => handleSelect(move.id)}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={20} />
                        <span className="font-medium text-gray-900">{move.name}</span>
                        <TypeIcon type={move.type} size="sm" />
                      </div>
                      <div className="flex gap-3 text-xs text-gray-600">
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
