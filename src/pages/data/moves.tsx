import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { TypeIcon, TypeFilterGrid } from '@/components/UI';
import { MoveCategoryIcon } from '@/components/UI/MoveCategoryIcon';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getApiBaseUrl } from '@/config/api';
import { useTheme } from '@/hooks/useTheme';
import Head from 'next/head';

const API_URL = getApiBaseUrl();

interface ChampionsMove {
  identifier: string;
  name: string;
  name_en: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect_pct: number | null;
  speed_priority: number | null;
  target: string | null;
  effect_battle: string | null;
  effect_in_depth: string | null;
  effect_secondary: string | null;
  makes_contact: boolean;
  is_sound_move: boolean;
  is_punch_move: boolean;
  is_biting_move: boolean;
  is_slicing_move: boolean;
  is_bullet_move: boolean;
  is_wind_move: boolean;
  is_powder_move: boolean;
}

type SortKey = 'name' | 'type' | 'category' | 'power' | 'accuracy' | 'pp' | 'speed_priority';

const MOVE_CATEGORIES: Array<'physical' | 'special' | 'status'> = ['physical', 'special', 'status'];

const FLAG_FILTER_KEYS: { key: keyof ChampionsMove; i18nKey: string }[] = [
  { key: 'makes_contact', i18nKey: 'moves.flags.contact' },
  { key: 'is_punch_move', i18nKey: 'moves.flags.punch' },
  { key: 'is_sound_move', i18nKey: 'moves.flags.sound' },
  { key: 'is_biting_move', i18nKey: 'moves.flags.biting' },
  { key: 'is_slicing_move', i18nKey: 'moves.flags.slicing' },
  { key: 'is_bullet_move', i18nKey: 'moves.flags.bullet' },
  { key: 'is_wind_move', i18nKey: 'moves.flags.wind' },
  { key: 'is_powder_move', i18nKey: 'moves.flags.powder' },
];

export default function ChampionsMovesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [catFilters, setCatFilters] = useState<string[]>([]);
  const [flagFilters, setFlagFilters] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const prev = theme;
    setTheme('dark');
    return () => setTheme(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const { data: allMoves, isLoading, error } = useQuery({
    queryKey: ['champions-moves', router.locale || 'en'],
    queryFn: async (): Promise<ChampionsMove[]> => {
      const res = await axios.get(`${API_URL}/champions/moves?lang=${router.locale || 'en'}`);
      return res.data.data.map((m: ChampionsMove) => ({
        ...m,
        category: m.category?.toLowerCase(),
        type: m.type?.toLowerCase(),
      }));
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const moves = useMemo((): ChampionsMove[] => {
    if (!allMoves) return [];
    let result = [...allMoves];

    if (typeFilters.length > 0) result = result.filter(m => typeFilters.includes(m.type));
    if (catFilters.length > 0) result = result.filter(m => catFilters.includes(m.category));
    if (flagFilters.length > 0) result = result.filter(m => flagFilters.every(f => (m as any)[f] === true));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.name_en?.toLowerCase().includes(q) ||
        m.identifier?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        const cmp = av.localeCompare(bv, router.locale || 'en');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const cmp = (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allMoves, typeFilters, catFilters, flagFilters, search, sortKey, sortDir, router.locale]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleType = (type: string) =>
    setTypeFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const toggleCat = (cat: string) =>
    setCatFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const toggleFlag = (flag: string) =>
    setFlagFilters(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]);

  const total = allMoves?.length ?? 0;
  const filtered = moves.length;
  const hasFilter = search || typeFilters.length > 0 || catFilters.length > 0 || flagFilters.length > 0;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return (
      <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
    return sortDir === 'asc' ? (
      <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        <div className="min-h-screen bg-dark-bg-primary">

          {/* Hero */}
          <div
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 50%, var(--color-bg-tertiary) 100%)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)' }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)' }}
            />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-400/70 mb-2">Champions</p>
              <h1 className="text-5xl sm:text-6xl font-bold text-dark-text-primary leading-none mb-2"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '-0.01em' }}>
                {t('moves.title')}
              </h1>
              {total > 0 && (
                <p className="text-sm text-gray-500">
                  {hasFilter ? t('moves.filteredMoves', { count: filtered }) : t('moves.totalMoves', { count: total })}
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Search + clear */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('moves.searchPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-dark-text-primary placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                />
              </div>
              {hasFilter && (
                <button
                  onClick={() => { setSearch(''); setTypeFilters([]); setCatFilters([]); setFlagFilters([]); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 transition-colors hover:text-white whitespace-nowrap"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
                >
                  {t('moves.clearFilters')}
                </button>
              )}
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                {t('moves.filterByType')}
                {typeFilters.length > 0 && <span className="ml-2 text-blue-400">({typeFilters.length})</span>}
              </label>
              <TypeFilterGrid selectedTypes={typeFilters} onToggle={toggleType} />
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                {t('moves.filterByCategory', 'Category')}
              </label>
              <div className="flex flex-wrap gap-2">
                {MOVE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={catFilters.includes(cat)
                      ? { background: 'rgba(37,99,235,0.25)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)' }
                      : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                    }
                  >
                    <MoveCategoryIcon category={cat} size={20} />
                    <span>{t(`moves.categories.${cat}`, cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced flag filters */}
            <div>
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {t('moves.advanced')}
                {flagFilters.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                    {flagFilters.length}
                  </span>
                )}
              </button>
              {showAdvanced && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {FLAG_FILTER_KEYS.map(({ key, i18nKey }) => (
                    <button
                      key={key}
                      onClick={() => toggleFlag(key as string)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={flagFilters.includes(key as string)
                        ? { background: 'rgba(37,99,235,0.25)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.4)' }
                        : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                      }
                    >
                      {t(i18nKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl p-4 text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {t('moves.error')}
              </div>
            ) : moves.length > 0 ? (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                {/* Header row */}
                <div className="grid gap-0 px-3 sm:px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] select-none"
                  style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', gridTemplateColumns: '2fr 1fr 1fr 3rem 3rem 3rem 3rem 3fr' }}>
                  {([
                    { key: 'name' as SortKey, label: t('moves.table.name') },
                    { key: 'type' as SortKey, label: t('moves.table.type') },
                    { key: 'category' as SortKey, label: t('moves.table.category') },
                    { key: 'power' as SortKey, label: t('moves.table.power') },
                    { key: 'accuracy' as SortKey, label: t('moves.table.accuracy') },
                    { key: 'pp' as SortKey, label: t('moves.table.pp') },
                    { key: 'speed_priority' as SortKey, label: t('moves.table.priority') },
                  ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                    <button key={key} onClick={() => handleSort(key)} className="group flex items-center gap-1 whitespace-nowrap hover:text-white transition-colors text-left">
                      {label}<SortIcon col={key} />
                    </button>
                  ))}
                  <span className="whitespace-nowrap">{t('moves.table.battleEffect')}</span>
                </div>
                {/* Rows */}
                <div className="space-y-1 p-1" style={{ background: 'var(--color-bg-primary)' }}>
                  {moves.map(move => (
                    <div
                      key={move.identifier}
                      onClick={() => router.push(`/data/moves/${move.identifier}`)}
                      className="group grid items-center gap-0 px-3 sm:px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
                      style={{
                        gridTemplateColumns: '2fr 1fr 1fr 3rem 3rem 3rem 3rem 3fr',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget;
                        el.style.background = 'rgba(59,130,246,0.15)';
                        el.style.border = '1px solid rgba(99,160,255,1)';
                        el.style.boxShadow = '0 0 0 1px rgba(99,160,255,0.5), 0 8px 32px rgba(59,130,246,0.3)';
                        el.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget;
                        el.style.background = 'rgba(255,255,255,0.03)';
                        el.style.border = '1px solid rgba(255,255,255,0.07)';
                        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
                        el.style.transform = '';
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-dark-text-primary group-hover:text-blue-300 transition-colors truncate">{move.name}</span>
                        <svg className="w-3 h-3 shrink-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div>{move.type ? <TypeIcon type={move.type} size="sm" /> : <span className="text-gray-600">—</span>}</div>
                      <div>{move.category ? <MoveCategoryIcon category={move.category as 'physical' | 'special' | 'status'} size={20} /> : <span className="text-gray-600">—</span>}</div>
                      <div className="text-center text-sm font-mono text-gray-300">{move.power ?? <span className="text-gray-600">—</span>}</div>
                      <div className="text-center text-sm font-mono text-gray-300">{move.accuracy != null ? `${move.accuracy}%` : <span className="text-gray-600">—</span>}</div>
                      <div className="text-center text-sm font-mono text-gray-300">{move.pp ?? <span className="text-gray-600">—</span>}</div>
                      <div className="text-center text-sm font-mono">
                        {move.speed_priority != null && move.speed_priority !== 0
                          ? <span className={move.speed_priority > 0 ? 'text-green-400' : 'text-red-400'}>{move.speed_priority > 0 ? `+${move.speed_priority}` : move.speed_priority}</span>
                          : <span className="text-gray-600">0</span>}
                      </div>
                      <div className="text-sm text-gray-400 min-w-0">
                        <div className="line-clamp-2">{move.effect_battle || <span className="text-gray-600">—</span>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <svg className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="50" cy="50" r="44" /><line x1="6" y1="50" x2="94" y2="50" />
                  <circle cx="50" cy="50" r="12" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="3" />
                  <circle cx="50" cy="50" r="6" fill="currentColor" />
                </svg>
                <p className="text-gray-500 font-medium">{t('moves.noResults')}</p>
                {hasFilter && (
                  <button onClick={() => { setSearch(''); setTypeFilters([]); setCatFilters([]); setFlagFilters([]); }}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    {t('moves.clearFilters')}
                  </button>
                )}
              </div>
            )}
          </div>
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
