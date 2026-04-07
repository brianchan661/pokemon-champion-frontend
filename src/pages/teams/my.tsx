import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/Layout/Layout';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { teamService } from '@/services/teamService';
import { MyTeamCard } from '@/components/Teams/MyTeamCard';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function MyTeamsPage() {
  const { t, i18n } = useTranslation('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const prev = theme;
    setTheme('dark');
    return () => setTheme(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/teams/my');
    }
  }, [authLoading, isAuthenticated, router]);

  const currentLang = i18n.language?.startsWith('ja') ? 'ja' : 'en';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myTeams', currentLang],
    queryFn: async () => {
      const response = await teamService.getMyTeams(currentLang);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const teams = data?.teams || [];
  const teamCount = data?.count || 0;
  const teamLimit = data?.limit || 10;

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <Layout>
        <div className="min-h-screen bg-dark-bg-primary py-8 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1
                    className="text-4xl font-bold text-white"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {t('teams.myTeams')}
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm">
                    {t('teams.teamCount', { count: teamCount, limit: teamLimit })}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/teams"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {t('teams.browseTeams')}
                  </Link>
                  <Link
                    href="/teams/create"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)' }}
                    onClick={(e) => {
                      if (teamCount >= teamLimit) {
                        e.preventDefault();
                        alert(t('teams.limitReached'));
                      }
                    }}
                  >
                    {t('teams.createTeam')}
                  </Link>
                </div>
              </div>

              {teamCount >= teamLimit && (
                <div className="rounded-xl p-4 text-yellow-200 text-sm" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)' }}>
                  <p className="font-semibold">{t('teams.limitReachedMessage')}</p>
                  <p className="mt-1 opacity-75">{t('teams.deleteToCreate')}</p>
                </div>
              )}
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
                <span className="ml-3 text-gray-500">{t('teams.loading')}</span>
              </div>
            ) : error ? (
              <div className="rounded-xl p-4 text-red-300 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {t('teams.error')}
              </div>
            ) : teams.length === 0 ? (
              <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="max-w-sm mx-auto">
                  <div className="text-6xl mb-4 opacity-20">⚪</div>
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {t('teams.noTeamsYet')}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">{t('teams.createFirstTeam')}</p>
                  <Link
                    href="/teams/create"
                    className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(37,99,235,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)' }}
                  >
                    {t('teams.createTeam')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teams.map((team) => (
                  <MyTeamCard key={team.id} team={team} onUpdate={() => refetch()} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
