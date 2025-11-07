import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Team } from '@brianchan661/pokemon-champion-shared';
import { Layout } from '@/components/Layout/Layout';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { teamService } from '@/services/teamService';
import { StrategyDisplay } from '@/components/Strategy/StrategyDisplay';
import { TypeIcon } from '@/components/UI/TypeIcon';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function MyTeamsPage() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/teams/my');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myTeams'],
    queryFn: async () => {
      const response = await teamService.getMyTeams();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      setDeleteConfirm(null);
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ teamId, isPublic }: { teamId: string; isPublic: boolean }) =>
      teamService.toggleTeamVisibility(teamId, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
    },
  });

  const handleDelete = async (teamId: string) => {
    await deleteMutation.mutateAsync(teamId);
  };

  const handleToggleVisibility = async (team: Team) => {
    await toggleVisibilityMutation.mutateAsync({
      teamId: team.id,
      isPublic: !team.isPublic,
    });
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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
    <Layout>
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('teams.myTeams')}
                </h1>
                <p className="text-gray-600 mt-2">
                  {t('teams.teamCount', { count: teamCount, limit: teamLimit })}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/teams"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {t('teams.browseTeams')}
                </Link>
                <Link
                  href="/teams/create"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                <p className="font-medium">{t('teams.limitReachedMessage')}</p>
                <p className="text-sm mt-1">{t('teams.deleteToCreate')}</p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">{t('teams.loading')}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {t('teams.error')}
            </div>
          )}

          {/* Teams List */}
          {!isLoading && !error && (
            <>
              {teams.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t('teams.noTeamsYet')}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t('teams.createFirstTeam')}
                    </p>
                    <Link
                      href="/teams/create"
                      className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      {t('teams.createTeam')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-bold text-gray-900">
                                {team.name}
                              </h2>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  team.isPublic
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {team.isPublic ? t('teams.public') : t('teams.private')}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{t('teams.strategy')}:</span>
                              <StrategyDisplay strategy={team.strategy} className="mt-1" />
                            </div>
                          </div>
                        </div>

                        {/* Pokemon Display */}
                        <div className="mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {team.pokemon.map((p, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative"
                              >
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
                                    <h3 className="font-bold text-lg text-gray-900">
                                      {p.pokemonData?.name || `Pokemon #${p.pokemonId}`}
                                    </h3>
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
                                    <div className="flex items-center gap-2">
                                      {p.itemData.spriteUrl && (
                                        <img
                                          src={p.itemData.spriteUrl}
                                          alt={p.itemData.name}
                                          className="w-6 h-6 object-contain"
                                        />
                                      )}
                                      <span className="text-xs text-gray-700">{p.itemData.name}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Moves */}
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Moves:</p>
                                  <div className="space-y-1">
                                    {p.movesData?.map((move: any) => (
                                      <div
                                        key={move.id}
                                        className="flex items-center gap-2 text-xs bg-white px-2 py-1 rounded"
                                      >
                                        <TypeIcon type={move.type} size="xs" />
                                        <span className="font-medium flex-1">{move.name}</span>
                                        <div className="flex items-center gap-1 text-gray-500">
                                          <span className="min-w-[2rem] text-right">
                                            {move.power || '-'}
                                          </span>
                                          <span className="text-gray-400">/</span>
                                          <span className="min-w-[2rem] text-right">
                                            {move.accuracy ? `${move.accuracy}%` : '-'}
                                          </span>
                                          <span className="text-gray-400">/</span>
                                          <span className="min-w-[1.5rem] text-right">
                                            {move.pp ? `${move.pp}PP` : '-'}
                                          </span>
                                        </div>
                                      </div>
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

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                            {team.likes} {t('teams.likes')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Link
                            href={`/teams/${team.id}`}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-center"
                          >
                            {t('teams.viewDetails')}
                          </Link>
                          <Link
                            href={`/teams/${team.id}/edit`}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                          >
                            {t('teams.edit')}
                          </Link>
                          <button
                            onClick={() => handleToggleVisibility(team)}
                            disabled={toggleVisibilityMutation.isPending}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                            title={
                              team.isPublic
                                ? t('teams.makePrivate')
                                : t('teams.makePublic')
                            }
                          >
                            {team.isPublic ? (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                          {deleteConfirm === team.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(team.id)}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                              >
                                {t('teams.confirmDelete')}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                              >
                                {t('teams.cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(team.id)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                              {t('teams.delete')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
