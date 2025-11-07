import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Team, ApiResponse } from '@brianchan661/pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { Button, LoadingSpinner, ErrorMessage, Pagination } from '@/components/UI';
import { TeamCard } from '@/components/Teams';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export default function TeamsListPage() {
  const { t } = useTranslation('common');
  const [sortBy, setSortBy] = useState<'created_at' | 'likes'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['teams', sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('sortBy', sortBy);
      params.append('order', sortOrder);
      params.append('limit', TEAMS_PER_PAGE.toString());
      params.append('offset', ((currentPage - 1) * TEAMS_PER_PAGE).toString());

      const response = await axios.get<ApiResponse<TeamsResponse>>(
        `${API_URL}/teams?${params.toString()}`
      );
      return response.data.data;
    },
  });

  const teams = data?.teams || [];
  const totalTeams = data?.total || 0;
  const totalPages = Math.ceil(totalTeams / TEAMS_PER_PAGE);

  const handleSortChange = (newSort: 'created_at' | 'likes') => {
    if (sortBy === newSort) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSort);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
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
        <meta property="og:title" content={`${t('teams.title')} | Pokemon Champion`} />
        <meta property="og:description" content={t('teams.description', 'Browse and discover competitive Pokemon teams shared by the community')} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/teams`} />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('teams.title')}
            </h1>
            <div className="flex gap-3">
              <Button href="/teams/my" variant="secondary">
                {t('teams.myTeams')}
              </Button>
              <Button href="/teams/create" variant="primary">
                {t('teams.createTeam')}
              </Button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6" role="region" aria-label="Sort options">
            <div className="flex items-center gap-4">
              <span id="sort-label" className="text-sm font-medium text-gray-700">{t('teams.sortBy')}:</span>
              <div className="flex gap-2" role="group" aria-labelledby="sort-label">
                <button
                  onClick={() => handleSortChange('created_at')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortBy === 'created_at'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-pressed={sortBy === 'created_at'}
                  aria-label={`Sort by ${sortOrder === 'desc' && sortBy === 'created_at' ? 'newest' : 'oldest'} teams`}
                >
                  {sortOrder === 'desc' && sortBy === 'created_at'
                    ? t('teams.sort.newest')
                    : t('teams.sort.oldest')}
                </button>
                <button
                  onClick={() => handleSortChange('likes')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortBy === 'likes'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-pressed={sortBy === 'likes'}
                  aria-label="Sort by most liked teams"
                >
                  {t('teams.sort.mostLiked')}
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && <LoadingSpinner message={t('teams.loading')} />}

          {/* Error State */}
          {error && <ErrorMessage message={t('teams.error')} />}

          {/* Teams Grid */}
          {!isLoading && !error && (
            <>
              {teams.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500">{t('teams.noResults')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {teams.map((team) => (
                      <TeamCard key={team.id} team={team} />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="mt-8"
                  />
                </>
              )}
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
