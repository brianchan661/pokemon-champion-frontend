import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Section } from '@/components/Layout/Section';
import { ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react';

// Helper for conditional classes
function classNames(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

// Static Data
// Map stats to translation keys in common.json
const STAT_KEYS = {
    'Attack': 'attack',
    'Defense': 'defense',
    'Sp. Atk': 'spAtk',
    'Sp. Def': 'spDef',
    'Speed': 'speed'
} as const;

const STATS = ['Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'] as const;
type Stat = typeof STATS[number];

// 5x5 Matrix: Increased Stat (Rows) x Decreased Stat (Cols)
// Row: Increase, Column: Decrease
// Order is same as STATS array: Atk, Def, SpA, SpD, Spe
const NATURE_MATRIX: string[][] = [
    // Increase Attack
    ['hardy', 'lonely', 'adamant', 'naughty', 'brave'],
    // Increase Defense
    ['bold', 'docile', 'impish', 'lax', 'relaxed'],
    // Increase Sp. Atk
    ['modest', 'mild', 'bashful', 'rash', 'quiet'],
    // Increase Sp. Def
    ['calm', 'gentle', 'careful', 'quirky', 'sassy'],
    // Increase Speed
    ['timid', 'hasty', 'jolly', 'naive', 'serious'],
];

export default function NatureGuidePage() {
    const { t } = useTranslation('common');
    const [selectedIncrease, setSelectedIncrease] = useState<Stat | null>(null);
    const [selectedDecrease, setSelectedDecrease] = useState<Stat | null>(null);

    const getNatureKey = (increase: Stat, decrease: Stat): string => {
        const row = STATS.indexOf(increase);
        const col = STATS.indexOf(decrease);
        return NATURE_MATRIX[row][col];
    };

    const handleSelectIncrease = (stat: Stat) => {
        setSelectedIncrease(prev => prev === stat ? null : stat);
    };

    const handleSelectDecrease = (stat: Stat) => {
        setSelectedDecrease(prev => prev === stat ? null : stat);
    };

    const getStatName = (stat: Stat) => t(`pokemon.stats.${STAT_KEYS[stat]}`);
    const getStatShortName = (stat: Stat) => {
        // For Japanese, regular name is already short enough usually, but let's stick to standard `pokemon.stats` which is what we have.
        // If we strictly wanted "Atk" vs "Attack" in English ONLY, we'd need separate keys.
        // But the common.json 'pokemon.stats' in EN uses "Atk", "Def", etc. already!
        // Wait, checking common.json...
        // "stats": { "attack": "Atk", ... } -> Yes! EN uses abbreviations.
        // JA uses "こうげき" (full word).
        // This works perfectly for the Matrix headers where we want concise text.
        return t(`pokemon.stats.${STAT_KEYS[stat]}`);
    };

    return (
        <>
            <Head>
                <title>Nature Guide | Pokemon Champion</title>
                <meta
                    name="description"
                    content="Interactive Pokemon Nature chart and calculator. Find the best nature for your Pokemon."
                />
            </Head>

            <Layout>
                <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-12">
                    <Section ariaLabel="Nature Guide">
                        <div className="mb-8">
                            <Link href="/guides" className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 mb-4 inline-block">
                                ← Back to Guides
                            </Link>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-4">
                                {t('guides.nature.title', 'Nature Guide')}
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                                {t('guides.nature.desc', 'Natures in Pokemon affect stat growth by increasing one stat by 10% and decreasing another by 10%. Use the interactive matrix below to find the perfect nature for your build.')}
                            </p>
                        </div>

                        {/* Interactive Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                            {/* Controls */}
                            <div className="lg:col-span-3 space-y-8">
                                {/* Increase Column */}
                                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-dark-border h-full">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                                            <ArrowUp size={14} />
                                        </div>
                                        {t('guides.nature.increase', 'Increase (+10%)')}
                                    </h3>
                                    <div className="space-y-2">
                                        {STATS.map((stat) => (
                                            <button
                                                key={`inc-${stat}`}
                                                onClick={() => handleSelectIncrease(stat)}
                                                className={classNames(
                                                    "w-full px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 flex items-center justify-between group",
                                                    selectedIncrease === stat
                                                        ? "bg-green-500 text-white shadow-md shadow-green-500/20 transform scale-105"
                                                        : "bg-gray-50 dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
                                                )}
                                            >
                                                <span>{getStatName(stat)}</span>
                                                {selectedIncrease === stat && <Plus className="animate-pulse w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-3 space-y-8">
                                {/* Decrease Column */}
                                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-dark-border h-full">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                                            <ArrowDown size={14} />
                                        </div>
                                        {t('guides.nature.decrease', 'Decrease (-10%)')}
                                    </h3>
                                    <div className="space-y-2">
                                        {STATS.map((stat) => (
                                            <button
                                                key={`dec-${stat}`}
                                                onClick={() => handleSelectDecrease(stat)}
                                                className={classNames(
                                                    "w-full px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 flex items-center justify-between group",
                                                    selectedDecrease === stat
                                                        ? "bg-red-500 text-white shadow-md shadow-red-500/20 transform scale-105"
                                                        : "bg-gray-50 dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                                                )}
                                            >
                                                <span>{getStatName(stat)}</span>
                                                {selectedDecrease === stat && <Minus className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Matrix */}
                            <div className="lg:col-span-6">
                                <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-dark-border overflow-x-auto">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('guides.nature.matrix', 'Nature Matrix')}</h3>

                                    <div className="w-full">
                                        {/* Header Row (Decrease Stats) */}
                                        <div className="grid grid-cols-6 gap-1 mb-1">
                                            <div className="flex items-end justify-end p-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            </div>
                                            {STATS.map((stat, i) => (
                                                <div
                                                    key={`head-${stat}`}
                                                    className={classNames(
                                                        "p-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center rounded-lg transition-colors whitespace-nowrap overflow-hidden text-ellipsis",
                                                        selectedDecrease === stat ? "bg-red-50 dark:bg-red-900/20" : "",
                                                        "text-red-500 dark:text-red-400"
                                                    )}
                                                >
                                                    -{getStatShortName(stat)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Matrix Body */}
                                        {STATS.map((incStat, rowIdx) => (
                                            <div key={`row-${incStat}`} className="grid grid-cols-6 gap-1 mb-1">
                                                {/* Header Column (Increase Stats) */}
                                                <div
                                                    className={classNames(
                                                        "p-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-end rounded-lg transition-colors whitespace-nowrap overflow-hidden text-ellipsis",
                                                        selectedIncrease === incStat ? "bg-green-50 dark:bg-green-900/20" : "",
                                                        "text-green-500 dark:text-green-400"
                                                    )}
                                                >
                                                    +{getStatShortName(incStat)}
                                                </div>

                                                {/* Cells */}
                                                {STATS.map((decStat, colIdx) => {
                                                    const natureKey = NATURE_MATRIX[rowIdx][colIdx];
                                                    const isActive = selectedIncrease === incStat && selectedDecrease === decStat;
                                                    const isRowActive = selectedIncrease === incStat;
                                                    const isColActive = selectedDecrease === decStat;
                                                    const isNeutral = incStat === decStat;

                                                    return (
                                                        <div
                                                            key={natureKey}
                                                            className={classNames(
                                                                "relative p-1 sm:p-2 rounded-lg border text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[60px]",
                                                                isActive
                                                                    ? "bg-primary-500 text-white border-primary-500 shadow-lg scale-110 z-10 ring-2 ring-primary-500/20"
                                                                    : isRowActive
                                                                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                                                                        : isColActive
                                                                            ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                                                                            : "bg-gray-50 dark:bg-dark-bg-primary border-gray-100 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-800"
                                                            )}
                                                        >
                                                            <span className={classNames(
                                                                "font-bold text-xs mb-0.5 whitespace-nowrap",
                                                                isActive ? "text-white" : "text-gray-900 dark:text-white"
                                                            )}>
                                                                {t(`natures.${natureKey}`)}
                                                            </span>
                                                            {isActive && (
                                                                <span className="text-[9px] opacity-90 leading-tight whitespace-nowrap hidden sm:block">
                                                                    {isNeutral ? "Neutral" : <>{getStatShortName(incStat)} ↑<br />{getStatShortName(decStat)} ↓</>}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>



                    </Section>
                </div>
            </Layout>
        </>
    );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'en', ['common'])),
        },
    };
};
