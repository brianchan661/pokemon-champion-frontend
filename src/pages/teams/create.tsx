import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/UI';
import axios from 'axios';
import { Pokemon, TeamPokemon } from '@brianchan661/pokemon-champion-shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CreateTeamPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [strategy, setStrategy] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect to new team builder
  useEffect(() => {
    router.push('/teams/builder');
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/teams/create');
    }
  }, [authLoading, isAuthenticated, router]);

  // Placeholder TeamPokemon structure - simplified for MVP
  const [teamPokemon, setTeamPokemon] = useState<Partial<TeamPokemon>[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    if (!strategy.trim()) {
      setError('Team strategy is required');
      return;
    }

    if (teamPokemon.length < 1 || teamPokemon.length > 6) {
      setError('Team must have between 1 and 6 Pokemon');
      return;
    }

    // Validate each Pokemon
    for (let i = 0; i < teamPokemon.length; i++) {
      const p = teamPokemon[i];
      if (!p.pokemon || !p.ability || !p.moves || p.moves.length !== 4) {
        setError(`Pokemon ${i + 1} is incomplete. Each Pokemon must have an ability and 4 moves.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/teams`,
        {
          name: name.trim(),
          description: description.trim(),
          strategy: strategy.trim(),
          pokemon: teamPokemon,
          isPublic,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        router.push('/teams/my');
      } else {
        setError(response.data.error || 'Failed to create team');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <>
      <Head>
        <title>{t('teams.createTeam')} | Pokemon Champion</title>
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-100 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button href="/teams/my" variant="secondary">
                ← Back to My Teams
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {t('teams.createTeam')}
              </h1>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Team Name */}
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter team name..."
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Brief description of your team..."
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Strategy */}
                <div className="mb-6">
                  <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy *
                  </label>
                  <textarea
                    id="strategy"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe your team's strategy and playstyle..."
                    rows={5}
                    maxLength={2000}
                    required
                  />
                </div>

                {/* Pokemon Builder - Simplified for MVP */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Pokemon ({teamPokemon.length}/6) *
                    </label>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-medium mb-2">
                      Full Team Builder Coming Soon
                    </p>
                    <p className="text-yellow-700 text-sm mb-4">
                      The interactive Pokemon selector with moves, abilities, and items is currently under development.
                      For now, you can create teams by manually entering data through the API or wait for the next update.
                    </p>
                    <p className="text-yellow-600 text-xs">
                      In the meantime, you can browse existing teams or import team data if you have it available.
                    </p>
                  </div>
                </div>

                {/* Visibility */}
                <div className="mb-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      Make this team public (others can view and like it)
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || teamPokemon.length < 1}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? 'Creating Team...' : 'Create Team'}
                  </button>
                  <Button
                    href="/teams/my"
                    variant="secondary"
                    className="px-6 py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </form>

              {/* Helper Text */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Team Building Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• A team must have between 1 and 6 Pokemon</li>
                  <li>• Each Pokemon needs exactly 4 moves and 1 ability</li>
                  <li>• Public teams can be liked and commented on by others</li>
                  <li>• You can create up to 10 teams per account</li>
                  <li>• Private teams are visible only to you</li>
                </ul>
              </div>
            </div>
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
