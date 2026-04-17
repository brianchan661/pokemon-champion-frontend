import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Team, ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { Pagination } from '@/components/UI';
import { TeamCard } from '@/components/Teams';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { getApiBaseUrl } from '@/config/api';
import { useTheme } from '@/hooks/useTheme';

const API_URL = getApiBaseUrl();

interface TeamsResponse {
  teams: Team[];
  total: number;
  likedTeamIds: string[];
  pagination: {
    limit: number;
    offset: number;
  };
}

const TEAMS_PER_PAGE = 20;

type SortKey = 'created_at' | 'likes';

export default function TeamsListPage() {
  const { t, i18n } = useTranslation('common');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [layout, setLayout] = useState<'grid' | 'list'>('list');
  const { theme, setTheme } = useTheme();

  // Force dark mode for this page
  useEffect(() => {
    const prev = theme;
    setTheme('dark');
    return () => setTheme(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLang = i18n.language.startsWith('ja') ? 'ja' : 'en';

  const { data, isLoading } = useQuery({
    queryKey: ['teams', sortBy, sortOrder, currentPage, currentLang],
    staleTime: 0,
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        order: sortOrder,
        limit: TEAMS_PER_PAGE.toString(),
        offset: ((currentPage - 1) * TEAMS_PER_PAGE).toString(),
        lang: currentLang,
      });
      const response = await axios.get<ApiResponse<TeamsResponse>>(
        `${API_URL}/teams?${params.toString()}`
      );
      return response.data.data;
    },
  });

  const teams = data?.teams || [];
  const totalTeams = data?.total || 0;
  const totalPages = Math.ceil(totalTeams / TEAMS_PER_PAGE);

  const handleSortChange = (newSort: SortKey) => {
    if (sortBy === newSort) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>{t('teams.title')} | Pokemon Champion</title>
        <meta name="description" content={t('teams.description', 'Browse and discover competitive Pokemon teams shared by the community')} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/teams`} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-dark-bg-primary">

          {/* Header */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-3xl font-bold text-dark-text-primary">{t('teams.title')}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <p className="text-dark-text-secondary text-sm">{t('teams.description', { defaultValue: 'Browse competitive teams shared by the community' })}</p>
                  {totalTeams > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                      {totalTeams} {t('teams.teamsCount', { count: totalTeams, defaultValue: 'teams' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link
                  href="/teams/my"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                >
                  {t('teams.myTeams')}
                </Link>
                <Link
                  href="/teams/create"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-primary-600 dark:bg-primary-600/25 text-white dark:text-primary-400 border border-primary-600 dark:border-primary-600/40"
                >
                  + {t('teams.createTeam')}
                </Link>
              </div>
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div
            className="sticky top-0 z-20"
            style={{
              background: 'var(--color-bg-primary)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mr-1">
                  {t('teams.sortBy')}
                </span>
                {([
                  { key: 'created_at' as SortKey, label: t('teams.sort.newest') },
                  { key: 'likes' as SortKey, label: t('teams.sort.mostLiked') },
                ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSortChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sortBy === key ? 'bg-primary-600 dark:bg-primary-600/25 text-white dark:text-primary-400' : ''}`}
                    style={sortBy === key
                      ? { border: '1px solid rgba(37,99,235,0.4)' }
                      : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                    }
                  >
                    {label}
                    {sortBy === key && (
                      <span className="ml-1 opacity-60">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {totalTeams > 0 && (
                  <span className="text-[11px] text-gray-600 shrink-0">
                    {t('pagination.page', { page: currentPage, total: totalPages, defaultValue: `Page ${currentPage} / ${totalPages}` })}
                  </span>
                )}
                {/* Layout toggle — hidden on mobile */}
                <div className="hidden md:flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <button
                    onClick={() => setLayout('grid')}
                    className="p-1.5 transition-all"
                    style={layout === 'grid'
                      ? { background: 'rgba(37,99,235,0.25)', color: '#60a5fa' }
                      : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }
                    }
                    title="2-column grid"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="8" height="8" rx="1.5" />
                      <rect x="13" y="3" width="8" height="8" rx="1.5" />
                      <rect x="3" y="13" width="8" height="8" rx="1.5" />
                      <rect x="13" y="13" width="8" height="8" rx="1.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className="p-1.5 transition-all"
                    style={layout === 'list'
                      ? { background: 'rgba(37,99,235,0.25)', color: '#60a5fa' }
                      : { background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }
                    }
                    title="1-column list"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="5" rx="1.5" />
                      <rect x="3" y="11" width="18" height="5" rx="1.5" />
                      <rect x="3" y="18" width="18" height="2.5" rx="1.25" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 rounded-2xl animate-pulse"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div
                className="rounded-2xl p-16 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-6xl mb-4 opacity-20">⚪</div>
                <h3
                  className="text-2xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {t('teams.noResults')}
                </h3>
                <p className="text-gray-500 text-sm mb-6">{t('teams.beFirst', { defaultValue: 'Be the first to share a team.' })}</p>
                <Link
                  href="/teams/create"
                  className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)' }}
                >
                  {t('teams.createTeam')}
                </Link>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 grid-cols-1 ${layout === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                  {teams.map((team, i) => (
                    <TeamCard key={team.id} team={team} index={i} layout={layout} />
                  ))}
                </div>

                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
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
