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
import { Team, Comment } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

export default function TeamDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Fetch team data
  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await teamService.getTeamById(id as string);
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

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/teams/${id}/comments`,
        { content, parentId: replyTo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamComments', id] });
      setCommentText('');
      setReplyTo(null);
    },
  });

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/teams/${id}`);
      return;
    }
    await likeMutation.mutateAsync();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/teams/${id}`);
      return;
    }
    await commentMutation.mutateAsync(commentText.trim());
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
        <meta name="description" content={team.description || team.strategy} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-6">
              <Link
                href="/teams"
                className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('teams.browseTeams')}
              </Link>
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
                      {/* Placeholder for Format tag if available in the future */}
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

                <div className="flex gap-3 shrink-0">
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

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('teams.strategy')}</h2>
                <StrategyDisplay strategy={team.strategy} />
              </div>
            </div>

            {/* Comments Section (Only for public teams) */}
            {team.isPublic && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Comments ({comments.length})
                </h2>

                {/* Comment Form */}
                {isAuthenticated ? (
                  <form onSubmit={handleComment} className="mb-8">
                    {replyTo && (
                      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        Replying to comment{' '}
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {commentText.length}/1000
                      </span>
                      <button
                        type="submit"
                        disabled={!commentText.trim() || commentMutation.isPending}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-8 text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Please log in to leave a comment
                    </p>
                    <Button href={`/auth?redirect=/teams/${id}`} variant="primary">
                      {t('auth.login')}
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.authorUsername || 'Unknown'}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
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
