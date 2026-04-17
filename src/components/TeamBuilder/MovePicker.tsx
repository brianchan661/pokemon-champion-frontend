import { useState, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { ChampionsMoveEntry } from '@/services/pokemonBuilderService';
import { TypeIcon } from '@/components/UI';
import { MoveCategoryIcon, MoveCategory } from '@/components/UI/MoveCategoryIcon';

const MOVE_CATEGORIES: MoveCategory[] = ['physical', 'special', 'status'];

function getMoveName(move: { nameEn: string; nameJa: string | null }, lang: string): string {
  if (lang.startsWith('ja') && move.nameJa) return move.nameJa;
  return move.nameEn;
}

interface MovePickerProps {
  pokemonName: string;
  availableMoves: ChampionsMoveEntry[];
  selectedMoves: { identifier: string }[];
  onToggleMove: (move: ChampionsMoveEntry) => void;
  onClose: () => void;
  lang: string;
}

export function MovePicker({ pokemonName, availableMoves, selectedMoves, onToggleMove, onClose, lang }: MovePickerProps) {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [catFilters, setCatFilters] = useState<MoveCategory[]>([]);

  const availableTypes = useMemo(() => {
    const types = new Set(availableMoves.map((m) => m.type.toLowerCase()));
    return Array.from(types).sort();
  }, [availableMoves]);

  const sorted = useMemo(() => {
    return availableMoves.slice().sort((a, b) => {
      const typeCmp = a.type.localeCompare(b.type);
      if (typeCmp !== 0) return typeCmp;
      return (b.power ?? 0) - (a.power ?? 0);
    });
  }, [availableMoves]);

  const filtered = useMemo(() => {
    let result = sorted;
    if (typeFilters.length > 0)
      result = result.filter((m) => typeFilters.includes(m.type.toLowerCase()));
    if (catFilters.length > 0)
      result = result.filter((m) => catFilters.includes(m.category as MoveCategory));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => getMoveName(m, lang).toLowerCase().includes(q) || m.type.toLowerCase().includes(q));
    }
    return result;
  }, [sorted, typeFilters, catFilters, search, lang]);

  const toggleType = (type: string) =>
    setTypeFilters((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  const toggleCat = (cat: MoveCategory) =>
    setCatFilters((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const isSelected = (m: ChampionsMoveEntry) => selectedMoves.some((s) => s.identifier === m.identifier);
  const isFull = selectedMoves.length >= 4;
  const hasFilter = search || typeFilters.length > 0 || catFilters.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{pokemonName}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t('battleReference.selectMoves', 'Select up to 4 moves')} ({selectedMoves.length}/4)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected moves preview */}
        {selectedMoves.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-white/5">
            {selectedMoves.map((s) => {
              const m = availableMoves.find((a) => a.identifier === s.identifier);
              if (!m) return null;
              return (
                <button
                  key={m.identifier}
                  onClick={() => onToggleMove(m)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <TypeIcon type={m.type} size="xs" />
                  {getMoveName(m, lang)}
                  <span className="ml-0.5 opacity-60">×</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="px-4 py-3 space-y-2 border-b border-gray-100 dark:border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('battleReference.searchMoves', 'Search moves...')}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-bg-tertiary text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-400"
            />
            {hasFilter && (
              <button
                onClick={() => { setSearch(''); setTypeFilters([]); setCatFilters([]); }}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 whitespace-nowrap"
              >
                {t('moves.clearFilters', 'Clear')}
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {MOVE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  catFilters.includes(cat)
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 text-primary-600 dark:text-primary-400'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/30'
                }`}
              >
                <MoveCategoryIcon category={cat} size={14} />
                {t(`moves.categories.${cat}`, cat)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`transition-all rounded-full p-0.5 ${
                  typeFilters.includes(type)
                    ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-dark-bg-secondary'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <TypeIcon type={type} size="xs" />
              </button>
            ))}
          </div>
        </div>

        {/* Move list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('battleReference.noMoves', 'No moves found.')}</p>
          ) : (
            filtered.map((move) => {
              const selected = isSelected(move);
              const disabled = !selected && isFull;
              return (
                <button
                  key={move.identifier}
                  onClick={() => !disabled && onToggleMove(move)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                    selected
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700'
                      : disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <TypeIcon type={move.type} size="xs" />
                  <MoveCategoryIcon category={move.category as MoveCategory} size={14} />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{getMoveName(move, lang)}</span>
                  <span className="text-xs font-mono text-gray-500 shrink-0 w-6 text-right">{move.power ?? '—'}</span>
                  <span className="text-xs font-mono text-gray-400 shrink-0 w-8 text-right">{move.accuracy ? `${move.accuracy}%` : '—'}</span>
                  <span className="text-xs font-mono text-gray-400 shrink-0 w-5 text-right">{move.pp ?? '—'}</span>
                  {selected && (
                    <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
