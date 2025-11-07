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
import { LoadingSpinner, ErrorMessage, Button, TypeIcon } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { teamService } from '@/services/teamService';
import { StrategyDisplay } from '@/components/Strategy/StrategyDisplay';
import { Team, Comment } from '@brianchan661/pokemon-champion-shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
        <div className="min-h-screen bg-gray-100 py-8 px-4">
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
        <div className="min-h-screen bg-gray-100 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <ErrorMessage message={error instanceof Error ? error.message : t('teams.error')} />
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
        <div className="min-h-screen bg-gray-100 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link
                href="/teams"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('teams.browseTeams')}
              </Link>
            </div>

            {/* Team Name and Pokemon Combined */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6 relative">
              {/* Author - Top Right */}
              <div className="absolute top-8 right-8 text-right">
                <p className="text-sm text-gray-600">
                  {t('teams.by')} <span className="font-medium">{team.authorUsername || 'Unknown'}</span>
                </p>
                {isOwner && (
                  <Link
                    href={`/teams/${team.id}/edit`}
                    className="inline-block mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                  >
                    {t('teams.edit')}
                  </Link>
                )}
              </div>

              {/* Team Name */}
              <div className="mb-6 pr-48">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-gray-900">{team.name}</h1>
                  {!team.isPublic && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      {t('teams.private')}
                    </span>
                  )}
                </div>
              </div>

              {/* Pokemon Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.pokemon.map((p, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
                    {/* Ability - Top Right */}
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                        {p.abilityData?.name || p.abilityIdentifier}
                      </span>
                    </div>

                    {/* Pokemon Header */}
                    <div className="flex items-center gap-3 mb-3 pr-24">
                      {p.pokemonData?.imageUrl && (
                        <img
                          src={p.pokemonData.imageUrl}
                          alt={p.pokemonData.name}
                          className="w-16 h-16 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <Link
                          href={`/pokemon/${p.pokemonData?.nationalNumber || p.pokemonId}`}
                          className="font-bold text-lg text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {p.pokemonData?.name || `Pokemon #${p.pokemonId}`}
                        </Link>
                        <p className="text-sm text-gray-600">
                          Lv. {p.level} • {p.natureData?.name || p.natureId}
                        </p>
                        {p.pokemonData?.types && (
                          <div className="flex gap-1 mt-1">
                            {p.pokemonData.types.map((type: string) => (
                              <TypeIcon key={type} type={type} size="sm" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Item */}
                    {p.itemData && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Item:</p>
                        <Link
                          href={`/data/items/${p.itemData.identifier}`}
                          className="flex items-center gap-2 hover:text-primary-600 transition-colors w-fit"
                        >
                          {p.itemData.spriteUrl && (
                            <img
                              src={p.itemData.spriteUrl}
                              alt={p.itemData.name}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <span className="text-xs text-gray-700">{p.itemData.name}</span>
                        </Link>
                      </div>
                    )}

                    {/* Moves */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Moves:</p>
                      <div className="space-y-1">
                        {p.movesData?.map((move: any) => (
                          <Link
                            key={move.id}
                            href={`/data/moves/${move.identifier}`}
                            className="flex items-center gap-2 text-xs bg-white px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                          >
                            <TypeIcon type={move.type} size="xs" />
                            <span className="font-medium flex-1">{move.name}</span>
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="min-w-[2rem] text-right">{move.power || '-'}</span>
                              <span className="text-gray-400">/</span>
                              <span className="min-w-[2rem] text-right">{move.accuracy ? `${move.accuracy}%` : '-'}</span>
                              <span className="text-gray-400">/</span>
                              <span className="min-w-[1.5rem] text-right">{move.pp ? `${move.pp}PP` : '-'}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Tera Type */}
                    {p.teraType && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs font-semibold text-gray-700">Tera Type:</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                          {p.teraType}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy and Stats */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                {team.isPublic && (
                  <>
                    <button
                      onClick={handleLike}
                      disabled={likeMutation.isPending}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        hasLiked
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                      {team.likes} {t('teams.likes')}
                    </button>
                  </>
                )}
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(team.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Strategy */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('teams.strategy')}</h2>
                <StrategyDisplay strategy={team.strategy} />
              </div>
            </div>

            {/* Comments Section (Only for public teams) */}
            {team.isPublic && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Comments ({comments.length})
                </h2>

                {/* Comment Form */}
                {isAuthenticated ? (
                  <form onSubmit={handleComment} className="mb-8">
                    {replyTo && (
                      <div className="mb-2 text-sm text-gray-600">
                        Replying to comment{' '}
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="text-primary-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
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
                  <div className="mb-8 text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">
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
                    <p className="text-gray-500 text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">
                              {comment.authorUsername || 'Unknown'}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
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
