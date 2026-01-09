import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { LoadingSpinner, ErrorMessage, Button, PokemonCard } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { teamService } from '@/services/teamService';
import { StrategyDisplay } from '@/components/Strategy/StrategyDisplay';
import { CommentSection } from '@/components/Social/CommentSection';
import { ShareButton } from '@/components/Social/ShareButton';
import { Team, Comment } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

export default function TeamDetailPage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const currentLang = i18n.language?.startsWith('ja') ? 'ja' : 'en';

  // Fetch team data
  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ['team', id, currentLang],
    queryFn: async () => {
      const response = await teamService.getTeamById(id as string, currentLang);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch comments (only for public teams)
  const { data: commentsData } = useQuery({
    queryKey: ['teamComments', id],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await axios.get<{ success: boolean; data: Comment[] }>(
        `${API_URL}/teams/${id}/comments`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return response.data.data;
    },
    enabled: !!id && teamData?.team?.isPublic,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/teams/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
  });



  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/teams/${id}`);
      return;
    }
    await likeMutation.mutateAsync();
  };



  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <LoadingSpinner message={t('teams.loading')} />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !teamData?.team) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <ErrorMessage error={error instanceof Error ? error : new Error(t('teams.error'))} />
            <div className="mt-4 text-center">
              <Button href="/teams" variant="secondary">
                {t('teams.browseTeams')}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const team = teamData.team;
  const hasLiked = teamData.hasLiked;
  const isOwner = user?.id === team.authorId;
  const comments = commentsData || [];

  return (
    <>
      <Head>
        <title>{team.name} | Pokemon Champion</title>
        <meta name="description" content={team.description || team.strategy || `Check out this Pokemon team by ${team.authorUsername}`} />

        {/* Open Graph Tags for Social Sharing */}
        <meta property="og:title" content={`${team.name} | Pokemon Champion`} />
        <meta property="og:description" content={team.description || team.strategy || `Check out this Pokemon team by ${team.authorUsername}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/teams/${team.id}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={team.name} />
        <meta name="twitter:description" content={team.description || team.strategy || `Check out this Pokemon team by ${team.authorUsername}`} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <Link
                href="/teams"
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('teams.browseTeams')}
              </Link>

              <div className="flex gap-3">
                <ShareButton team={team} />

                {team.isPublic && (
                  <button
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 text-sm ${hasLiked
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {hasLiked ? 'Liked' : 'Like'} ({team.likes})
                  </button>
                )}
              </div>
            </div>

            {/* Pokemon Grid - Now at the top */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {team.pokemon.map((p, index) => (
                <PokemonCard
                  key={index}
                  pokemon={p}
                  variant="detailed"
                  enableLinks={true}
                  className="h-full"
                />
              ))}
            </div>

            {/* Team Info & Strategy Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-gray-100 dark:border-gray-700 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {team.name}
                    </h1>
                    <div className="flex gap-2">
                      {team.isPublic ? (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium border border-blue-200 dark:border-blue-800">
                          Public
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium border border-gray-200 dark:border-gray-600">
                          {t('teams.private')}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium border border-gray-200 dark:border-gray-600">
                        OU
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <p className="flex items-center gap-1">
                      {t('teams.by')} <span className="font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">{team.authorUsername || 'Unknown'}</span>
                    </p>
                    <span>•</span>
                    <p>{new Date(team.createdAt).toLocaleDateString()}</p>
                    {isOwner && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/teams/${team.id}/edit`}
                          className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                        >
                          {t('teams.edit')}
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons Area (Previously here) */}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('teams.strategy')}</h2>
                <StrategyDisplay strategy={team.strategy} />
              </div>
            </div>

            {/* Comments Section (Only for public teams) */}
            {team.isPublic && (
              <CommentSection
                teamId={team.id}
                comments={comments}
                isPublic={team.isPublic}
                isAuthenticated={isAuthenticated}
              />
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
