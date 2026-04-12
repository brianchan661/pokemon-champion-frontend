import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getApiBaseUrl } from '@/config/api';
import { useTheme } from '@/hooks/useTheme';
import Head from 'next/head';

const API_URL = getApiBaseUrl();

interface ChampionsAbility {
  identifier: string;
  name: string;
  name_en: string;
  description: string;
}

type SortKey = 'name';

export default function ChampionsAbilitiesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const prev = theme;
    setTheme('dark');
    return () => setTheme(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: allAbilities, isLoading, error, refetch } = useQuery({
    queryKey: ['champions-abilities', router.locale || 'en'],
    queryFn: async (): Promise<ChampionsAbility[]> => {
      const res = await axios.get(`${API_URL}/champions/abilities?lang=${router.locale || 'en'}`);
      return res.data.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const abilities = useMemo((): ChampionsAbility[] => {
    if (!allAbilities) return [];
    let result = [...allAbilities];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.name_en?.toLowerCase().includes(q) ||
        a.identifier?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const av = a.name;
      const bv = b.name;
      const cmp = (av || '').localeCompare(bv || '', router.locale || 'en');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [allAbilities, search, sortKey, sortDir, router.locale]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const total = allAbilities?.length ?? 0;
  const filtered = abilities.length;
  const isFiltered = search.length > 0;

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
                {t('abilities.title')}
              </h1>
              {total > 0 && (
                <p className="text-sm text-gray-500">
                  {isFiltered ? t('abilities.filteredCount', { filtered, total }) : t('abilities.totalCount', { count: total })}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('abilities.searchPlaceholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-dark-text-primary placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 transition-colors hover:text-white whitespace-nowrap"
                  style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
                >
                  {t('abilities.clearSearch')}
                </button>
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
                <p className="mb-3">{t('abilities.error')}</p>
                <button onClick={() => refetch()} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'rgba(239,68,68,0.3)' }}>
                  {t('abilities.retry')}
                </button>
              </div>
            ) : abilities.length > 0 ? (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                {/* Header */}
                <div className="grid px-3 sm:px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] select-none"
                  style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', gridTemplateColumns: '200px 1fr' }}>
                  <button onClick={() => handleSort('name')} className="group flex items-center gap-1 whitespace-nowrap hover:text-white transition-colors text-left">
                    {t('abilities.table.name')}<SortIcon col="name" />
                  </button>
                  <span>{t('abilities.table.description')}</span>
                </div>
                {/* Rows */}
                <div className="space-y-1 p-1" style={{ background: 'var(--color-bg-primary)' }}>
                  {abilities.map(ability => (
                    <div
                      key={ability.identifier}
                      onClick={() => router.push(`/data/abilities/${ability.identifier}`)}
                      className="group grid items-center px-3 sm:px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
                      style={{
                        gridTemplateColumns: '200px 1fr',
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
                        <span className="text-sm font-semibold text-dark-text-primary group-hover:text-blue-300 transition-colors truncate">{ability.name}</span>
                        <svg className="w-3 h-3 shrink-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-400 min-w-0">
                        {ability.description || <span className="text-gray-600">—</span>}
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
                <p className="text-gray-500 font-medium">{t('abilities.noResults')}</p>
                {isFiltered && (
                  <button onClick={() => setSearch('')} className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    {t('abilities.clearSearch')}
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
