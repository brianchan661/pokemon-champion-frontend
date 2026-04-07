import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
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
import { TypeIcon } from '@/components/UI/TypeIcon';
import { Team, Comment } from '@brianchan661/pokemon-champion-shared';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

/** Compact sprite strip shown in the hero section */
function PokemonStrip({ pokemon }: { pokemon: Team['pokemon'] }) {
  return (
    <div className="flex items-center gap-1">
      {pokemon.slice(0, 6).map((p, i) => (
        <div
          key={i}
          className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
          }}
          title={p.pokemonData?.name}
        >
          {p.pokemonData?.imageUrl ? (
            <img
              src={p.pokemonData.imageUrl}
              alt={p.pokemonData.name}
              className="w-full h-full object-contain p-0.5"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/40">?</div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Type coverage chips derived from the full team */
function TypeCoverage({ pokemon }: { pokemon: Team['pokemon'] }) {
  const typeSet = new Set<string>();
  pokemon.forEach((p) => p.pokemonData?.types?.forEach((t) => typeSet.add(t)));
  const types = Array.from(typeSet);
  if (types.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => (
        <TypeIcon key={type} type={type} size="sm" />
      ))}
    </div>
  );
}

export default function TeamDetailPage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const prev = theme;
    setTheme('dark');
    return () => setTheme(prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const queryClient = useQueryClient();

  const currentLang = i18n.language?.startsWith('ja') ? 'ja' : 'en';

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ['team', id, currentLang],
    queryFn: async () => {
      const response = await teamService.getTeamById(id as string, currentLang);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!id,
  });

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
        <div className="min-h-screen bg-dark-bg-primary py-8 px-4">
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
        <div className="min-h-screen bg-dark-bg-primary py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <ErrorMessage error={error instanceof Error ? error : new Error(t('teams.error'))} />
            <div className="mt-4 text-center">
              <Button href="/teams" variant="secondary">{t('teams.browseTeams')}</Button>
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
        <meta property="og:title" content={`${team.name} | Pokemon Champion`} />
        <meta property="og:description" content={team.description || team.strategy || `Check out this Pokemon team by ${team.authorUsername}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/teams/${team.id}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={team.name} />
        <meta name="twitter:description" content={team.description || team.strategy || `Check out this Pokemon team by ${team.authorUsername}`} />
        {/* Rajdhani font for headings */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-dark-bg-primary">

          {/* ─── HERO BANNER ─────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 60%)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {/* Decorative blobs */}
            <div
              className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Back link */}
              <Link
                href="/teams"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('teams.browseTeams')}
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                {/* Left: title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {team.isPublic ? (
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                      >
                        Public
                      </span>
                    ) : (
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.2)' }}
                      >
                        {t('teams.private')}
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
                    >
                      OU
                    </span>
                  </div>

                  <h1
                    className="text-4xl font-bold text-dark-text-primary truncate"
                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.01em' }}
                  >
                    {team.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                    <span>
                      {t('teams.by')}{' '}
                      <span className="font-semibold text-primary-400">{team.authorUsername || 'Unknown'}</span>
                    </span>
                    <span className="text-gray-600">·</span>
                    <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                    {isOwner && (
                      <>
                        <span className="text-gray-600">·</span>
                        <Link href={`/teams/${team.id}/edit`} className="text-primary-400 hover:text-primary-300 font-medium">
                          {t('teams.edit')}
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Type coverage */}
                  <div className="mt-3">
                    <TypeCoverage pokemon={team.pokemon} />
                  </div>
                </div>

                {/* Right: sprite strip + actions */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <PokemonStrip pokemon={team.pokemon} />
                  <div className="flex gap-2">
                    <ShareButton team={team} />
                    {team.isPublic && (
                      <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={hasLiked
                          ? { background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }
                          : { background: 'var(--color-bg-tertiary)', color: '#9ca3af', border: '1px solid var(--color-border)' }
                        }
                      >
                        <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {hasLiked ? 'Liked' : 'Like'} ({team.likes})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── MAIN CONTENT ────────────────────────────────────────── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {/* Pokemon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* Strategy section */}
            {(team.strategy || team.description) && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(160deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <h2
                  className="text-xl font-bold text-dark-text-primary mb-4"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {t('teams.strategy')}
                </h2>
                <StrategyDisplay strategy={team.strategy} />
              </div>
            )}

            {/* Comments */}
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
