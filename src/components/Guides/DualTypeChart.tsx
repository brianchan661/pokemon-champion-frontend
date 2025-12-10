import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { TypeIcon } from '@/components/UI/TypeIcon';
import { TYPES, PokeType, getEffectiveness } from '@/data/typeChart';

export function DualTypeChart() {
    const { t } = useTranslation('common');
    const [secondaryType, setSecondaryType] = useState<PokeType | null>(null);
    const [hoveredCell, setHoveredCell] = useState<{ atk: PokeType; def: PokeType } | null>(null);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">
                        {t('guides.typeChart.title', 'Type Effectiveness Calculator')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('guides.typeChart.description', 'Select a secondary type to see dual-type weaknesses.')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('guides.typeChart.secondaryType', 'Secondary Defense Type:')}
                    </label>
                    <div className="relative">
                        <select
                            value={secondaryType || ''}
                            onChange={(e) => setSecondaryType(e.target.value ? (e.target.value as PokeType) : null)}
                            className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8"
                        >
                            <option value="">{t('guides.typeChart.none', 'None')}</option>
                            {TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {t(`types.${type.toLowerCase()}`, type)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto" onMouseLeave={() => setHoveredCell(null)}>
                <table className="w-full text-sm text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 sticky left-0 z-10 min-w-[120px]">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-normal mb-1">
                                    {t('guides.typeChart.atkDef', 'Atk \\ Def')}
                                </div>
                            </th>
                            {TYPES.map((defType) => (
                                <th key={defType}
                                    className={`p-2 border border-gray-200 dark:border-gray-700 min-w-[40px] transition-colors duration-75 ${hoveredCell?.def === defType
                                        ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-inset ring-blue-400 dark:ring-blue-500'
                                        : ''
                                        }`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <TypeIcon type={defType} size="sm" />
                                        {secondaryType && secondaryType !== defType && (
                                            <TypeIcon type={secondaryType} size="sm" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {TYPES.map((atkType) => (
                            <tr key={atkType} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className={`p-2 border border-gray-200 dark:border-gray-700 font-medium bg-gray-50 dark:bg-gray-800 sticky left-0 z-10 transition-colors duration-75 ${hoveredCell?.atk === atkType
                                    ? '!bg-blue-100 dark:!bg-blue-900/50 ring-2 ring-inset ring-blue-400 dark:ring-blue-500'
                                    : ''
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        <TypeIcon type={atkType} size="md" showLabel />
                                    </div>
                                </td>
                                {TYPES.map((defType) => {
                                    const effectiveness = getEffectiveness(atkType, defType, secondaryType);
                                    const isHoveredRow = hoveredCell?.atk === atkType;
                                    const isHoveredCol = hoveredCell?.def === defType;
                                    const isHoveredCell = isHoveredRow && isHoveredCol;

                                    let bgClass = '';
                                    let textClass = 'text-gray-500 dark:text-gray-400';
                                    let content = '';

                                    if (effectiveness === 4) {
                                        bgClass = 'bg-red-100 dark:bg-red-900/30';
                                        textClass = 'text-red-700 dark:text-red-400 font-bold';
                                        content = '4×';
                                    } else if (effectiveness === 2) {
                                        bgClass = 'bg-orange-100 dark:bg-orange-900/30';
                                        textClass = 'text-orange-700 dark:text-orange-400 font-bold';
                                        content = '2×';
                                    } else if (effectiveness === 1) {
                                        content = '';
                                    } else if (effectiveness === 0.5) {
                                        bgClass = 'bg-green-100 dark:bg-green-900/30';
                                        textClass = 'text-green-700 dark:text-green-400';
                                        content = '½';
                                    } else if (effectiveness === 0.25) {
                                        bgClass = 'bg-green-200 dark:bg-green-800/50';
                                        textClass = 'text-green-800 dark:text-green-300 font-bold';
                                        content = '¼';
                                    } else if (effectiveness === 0) {
                                        bgClass = 'bg-gray-200 dark:bg-gray-700';
                                        textClass = 'text-gray-700 dark:text-gray-300 font-bold';
                                        content = '0';
                                    }

                                    // Highlighting logic
                                    if (isHoveredCell) {
                                        // Strong highlight for the active cell
                                        bgClass = `ring-2 ring-inset ring-blue-500 z-20 ${bgClass || 'bg-blue-50 dark:bg-gray-700'}`;
                                    } else if (isHoveredRow || isHoveredCol) {
                                        // Subtle highlight for the row/col
                                        bgClass = `${bgClass} brightness-95 dark:brightness-110`;
                                        if (!effectiveness || effectiveness === 1) {
                                            bgClass += ' bg-gray-50 dark:bg-gray-700/50';
                                        }
                                    }

                                    return (
                                        <td key={defType}
                                            className={`p-1 border border-gray-200 dark:border-gray-700 ${bgClass} transition-colors cursor-crosshair`}
                                            onMouseEnter={() => setHoveredCell({ atk: atkType, def: defType })}>
                                            <span className={textClass}>{content}</span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
