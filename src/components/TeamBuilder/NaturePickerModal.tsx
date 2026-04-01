import { useTranslation } from 'next-i18next';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Nature } from '@/services/naturesService';

interface NaturePickerModalProps {
  natures: Nature[];
  selectedNatureId: number;
  onSelect: (natureId: number) => void;
  onClose: () => void;
}

// The 5 stats used in the nature grid (no HP)
const GRID_STATS = ['attack', 'defense', 'sp_atk', 'sp_def', 'speed'] as const;
type GridStat = typeof GRID_STATS[number];

const STAT_LABEL_KEY: Record<GridStat, string> = {
  attack:   'attack',
  defense:  'defense',
  sp_atk:   'specialAttack',
  sp_def:   'specialDefense',
  speed:    'speed',
};


export function NaturePickerModal({ natures, selectedNatureId, onSelect, onClose }: NaturePickerModalProps) {
  const { t } = useTranslation('common');

  // Build lookup: [increased][decreased] -> nature
  const grid: Record<string, Record<string, Nature>> = {};
  const neutralNatures: Nature[] = [];

  natures.forEach((n) => {
    if (n.increasedStat && n.decreasedStat) {
      if (!grid[n.increasedStat]) grid[n.increasedStat] = {};
      grid[n.increasedStat][n.decreasedStat] = n;
    } else {
      neutralNatures.push(n);
    }
  });

  const selectedNature = natures.find((n) => n.id === selectedNatureId);

  const statLabel = (stat: GridStat) =>
    t(`teamBuilder.statLabels.${STAT_LABEL_KEY[stat]}`, stat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-800 dark:text-dark-text-primary">
              {t('teamBuilder.nature', 'Nature')}
            </span>
            {selectedNature && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold">
                {t(`natures.${selectedNature.identifier}`, selectedNature.name)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {/* Corner cell */}
                  <th className="w-16 pb-2" />
                  {GRID_STATS.map((dec) => {
                    return (
                      <th key={dec} className="pb-2 px-1 font-semibold text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-200 text-xs font-semibold">
                          {statLabel(dec)} <ArrowDown className="w-3 h-3" />
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {GRID_STATS.map((inc) => {
                  return (
                    <tr key={inc}>
                      {/* Row header */}
                      <td className="pr-2 py-1 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-800/60 text-red-700 dark:text-red-200 text-xs font-semibold">
                          {statLabel(inc)} <ArrowUp className="w-3 h-3" />
                        </span>
                      </td>
                      {GRID_STATS.map((dec) => {
                        if (inc === dec) {
                          // Diagonal — no nature exists here, show dash
                          return (
                            <td key={dec} className="px-1 py-1 text-center">
                              <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                            </td>
                          );
                        }
                        const nature = grid[inc]?.[dec];
                        if (!nature) return <td key={dec} />;
                        const isSelected = nature.id === selectedNatureId;
                        return (
                          <td key={dec} className="px-0.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => { onSelect(nature.id); onClose(); }}
                              className={`w-full px-2 py-2 rounded-md text-center font-medium transition-all ${
                                isSelected
                                  ? 'bg-primary-600 text-white shadow-md scale-105 ring-2 ring-primary-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-700 dark:hover:text-primary-300'
                              }`}
                            >
                              {t(`natures.${nature.identifier}`, nature.name)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Neutral natures — inline below grid */}
          {neutralNatures.length > 0 && (
            <div className="border-t border-gray-200 dark:border-dark-border pt-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap w-16 text-right flex-shrink-0">
                  {t('teamBuilder.neutralNatures', 'Neutral')}
                </span>
                <div className="flex flex-1 gap-1.5">
                  {neutralNatures.map((nature) => {
                    const isSelected = nature.id === selectedNatureId;
                    return (
                      <button
                        key={nature.id}
                        type="button"
                        onClick={() => { onSelect(nature.id); onClose(); }}
                        className={`flex-1 px-2 py-2 rounded-md text-sm text-center font-medium transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-md scale-105 ring-2 ring-primary-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-700 dark:hover:text-primary-300'
                        }`}
                      >
                        {t(`natures.${nature.identifier}`, nature.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
