import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import { Layout } from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/UI';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Pokemon, TeamPokemon } from '@brianchan661/pokemon-champion-shared';
import { PokemonSelector } from '@/components/TeamBuilder/PokemonSelector';
import { TeamSlots, TeamSlot } from '@/components/TeamBuilder/TeamSlots';
import { PokemonConfigurator } from '@/components/TeamBuilder/PokemonConfigurator';

import { MentionTextarea } from '@/components/Strategy/MentionTextarea';
import { TeamTypeAnalysis } from '@/components/TeamBuilder/TeamTypeAnalysis';
import { pokemonBuilderService } from '@/services/pokemonBuilderService';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

export default function TeamBuilderPage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { teamId, new: isNew } = router.query; // teamId for editing, new for fresh start

  // Team metadata
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState(''); // This is now the strategy field
  const [isPublic, setIsPublic] = useState(true);

  // Team state
  const [team, setTeam] = useState<TeamSlot[]>(Array.from({ length: 6 }, () => ({ id: Math.random().toString(36).substring(2, 15) })));
  const [activeSlot, setActiveSlot] = useState<number | undefined>(undefined);
  const [configuringPokemon, setConfiguringPokemon] = useState<Pokemon | null>(null);

  // UI state
  const [step, setStep] = useState<1 | 2>(1); // 1: Pokemon Selection, 2: Team Metadata
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPokemonSelector, setShowPokemonSelector] = useState(false);

  // Redirect if not authenticated
  // Redirect logic removed to allow guest access
  /*
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/teams/builder');
    }
  }, [authLoading, isAuthenticated, router]);
  */

  // Load existing team if editing
  useEffect(() => {
    if (teamId && isAuthenticated) {
      loadExistingTeam(teamId as string);
    }
  }, [teamId, isAuthenticated]);

  // Auto-save to localStorage
  // Auto-save to localStorage
  useEffect(() => {
    // Allow auto-save for guests too
    if (team.some(s => s.pokemon) || teamName) {
      const autoSaveData = {
        teamName,
        teamDescription,
        isPublic,
        team,
        timestamp: Date.now(),
      };
      localStorage.setItem('teamBuilder_autoSave', JSON.stringify(autoSaveData));
    }
  }, [team, teamName, teamDescription, isPublic]);

  // Load auto-saved data on mount (for new teams only, not when editing)
  useEffect(() => {
    if (!teamId) { // Removed isAuthenticated check
      const autoSave = localStorage.getItem('teamBuilder_autoSave');
      if (autoSave) {
        try {
          const data = JSON.parse(autoSave);
          // Only load if less than 24 hours old
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            setTeamName(data.teamName || '');
            setTeamDescription(data.teamDescription || '');
            setIsPublic(data.isPublic ?? true);
            // Ensure IDs exist for loaded team (migration for old saves)
            const loadedTeam = (data.team || Array.from({ length: 6 }, () => ({}))).map((slot: any) => ({
              ...slot,
              id: slot.id || Math.random().toString(36).substring(2, 15)
            }));
            // Ensure exactly 6 slots
            while (loadedTeam.length < 6) {
              loadedTeam.push({ id: Math.random().toString(36).substring(2, 15) });
            }
            setTeam(loadedTeam.slice(0, 6));
          } else {
            localStorage.removeItem('teamBuilder_autoSave');
          }
        } catch (e) {
          console.error('Failed to load auto-save:', e);
          localStorage.removeItem('teamBuilder_autoSave');
        }
      }
    }
  }, [teamId]); // Removed isAuthenticated dependency

  async function loadExistingTeam(id: string) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        const teamData = response.data.data.team;
        setTeamName(teamData.name);
        setTeamDescription(teamData.strategy || teamData.description || ''); // Use strategy field as description
        setIsPublic(teamData.isPublic);

        // Load Pokemon data
        // Backend enrichTeamPokemon already returns pokemonData at the top level
        const loadedTeam: TeamSlot[] = Array.from({ length: 6 }, () => ({ id: Math.random().toString(36).substring(2, 15) }));
        for (let i = 0; i < teamData.pokemon.length && i < 6; i++) {
          const tp = teamData.pokemon[i];
          loadedTeam[i].pokemon = tp; // tp already has pokemonData from backend enrichment
        }
        setTeam(loadedTeam);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
      setError('Failed to load team for editing');
    }
  }

  // Handle Pokemon selection
  const handlePokemonSelect = async (pokemon: Pokemon) => {
    if (activeSlot === undefined) return;

    setConfiguringPokemon(pokemon);
    setShowPokemonSelector(false);
  };

  // Handle Pokemon configuration save
  const handleConfigSave = async (config: TeamPokemon) => {
    if (activeSlot === undefined || !configuringPokemon) return;

    // Load full Pokemon data
    const currentLang = (i18n.language.startsWith('ja') ? 'ja' : 'en') as 'en' | 'ja';
    const pokemonResult = await pokemonBuilderService.getPokemonByNationalNumber(
      configuringPokemon.nationalNumber,
      currentLang
    );

    if (pokemonResult.success && pokemonResult.data) {
      const newTeam = [...team];
      newTeam[activeSlot] = {
        ...newTeam[activeSlot], // Preserve ID
        pokemon: {
          ...config,
          pokemonData: {
            id: pokemonResult.data.id,
            nationalNumber: pokemonResult.data.nationalNumber,
            name: pokemonResult.data.name,
            imageUrl: pokemonResult.data.imageUrl,
            types: pokemonResult.data.types,
          },
        },
      };
      setTeam(newTeam);
      setConfiguringPokemon(null);
      setActiveSlot(undefined);
      setSuccessMessage('Pokemon configured successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Handle Pokemon removal
  const handleRemovePokemon = (index: number) => {
    const newTeam = [...team];
    newTeam[index] = { id: newTeam[index].id }; // Remove pokemon, preserve ID
    setTeam(newTeam);
  };

  // Handle slot click
  const handleSlotClick = (index: number) => {
    setActiveSlot(index);
    if (team[index].pokemon) {
      // Edit existing Pokemon
      const pokemonData = team[index].pokemon!.pokemonData;
      setConfiguringPokemon({
        id: pokemonData.id,
        nationalNumber: pokemonData.nationalNumber,
        name: pokemonData.name,
        types: pokemonData.types,
        imageUrl: pokemonData.imageUrl,
      } as Pokemon);
    } else {
      // Add new Pokemon
      setShowPokemonSelector(true);
    }
  };

  // Save team
  const handleNextStep = () => {
    const teamPokemonCount = team.filter(s => s.pokemon).length;
    if (teamPokemonCount === 0) {
      setError(t('teamBuilder.addPokemonError', 'Add at least one Pokemon to your team before continuing'));
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const handleSaveTeam = async () => {
    setError('');
    setSuccessMessage('');

    // Validation
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (!teamDescription.trim()) {
      setError('Team description is required');
      return;
    }

    const teamPokemon = team.filter(s => s.pokemon).map(s => s.pokemon!);

    if (teamPokemon.length === 0) {
      setError(t('teamBuilder.addPokemonError', 'Add at least one Pokemon to your team'));
      return;
    }

    // Validate each Pokemon has required fields
    for (let i = 0; i < teamPokemon.length; i++) {
      const pokemon = teamPokemon[i];
      const missingFields: string[] = [];

      if (!pokemon.pokemonId) missingFields.push('pokemonId');
      if (!pokemon.level) missingFields.push('level');
      if (!pokemon.abilityIdentifier) missingFields.push('ability');
      if (!pokemon.moves || pokemon.moves.length === 0) missingFields.push('moves');
      if (pokemon.natureId === undefined || pokemon.natureId === null) missingFields.push('nature');
      if (!pokemon.evs) missingFields.push('EVs');
      if (!pokemon.ivs) missingFields.push('IVs');

      if (missingFields.length > 0) {
        setError(`Pokemon at position ${i + 1} is missing required fields: ${missingFields.join(', ')}`);
        console.error('Invalid Pokemon data:', pokemon);
        return;
      }
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        // Force a final auto-save before redirecting
        const autoSaveData = {
          teamName,
          teamDescription,
          isPublic,
          team,
          timestamp: Date.now(),
        };
        localStorage.setItem('teamBuilder_autoSave', JSON.stringify(autoSaveData));

        // Redirect to auth with returnUrl
        router.push('/auth?returnUrl=/teams/builder');
        return;
      }

      const endpoint = teamId ? `${API_URL}/teams/${teamId}` : `${API_URL}/teams`;
      const method = teamId ? 'put' : 'post';

      // Transform stat names from frontend format to backend format
      const transformedPokemon = teamPokemon.map(p => {
        return {
          pokemonId: p.pokemonId,
          level: p.level,
          abilityIdentifier: p.abilityIdentifier,
          moves: p.moves,
          natureId: p.natureId,
          itemId: p.itemId,
          teraType: p.teraType,
          evs: p.evs || undefined,
          ivs: p.ivs || undefined,
        };
      });

      const payload = {
        name: teamName.trim(),
        description: teamDescription.trim(), // This is strategy content now
        strategy: teamDescription.trim(), // Backend expects 'strategy' field
        pokemon: transformedPokemon,
        isPublic,
      };

      const response = await axios[method](
        endpoint,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Clear auto-save
        localStorage.removeItem('teamBuilder_autoSave');
        // Invalidate myTeams query to ensure fresh data on redirect
        await queryClient.invalidateQueries({ queryKey: ['myTeams'] });

        setSuccessMessage(teamId ? 'Team updated successfully!' : 'Team created successfully!');
        setTimeout(() => {
          router.push('/teams/my');
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to save team');
      }
    } catch (err: any) {
      console.error('Save team error:', err);
      console.error('Error response:', err.response?.data);

      if (err.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
        setTimeout(() => {
          router.push('/auth?redirect=/teams/builder');
        }, 2000);
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          router.push('/auth?redirect=/teams/builder');
        }, 2000);
      } else {
        // Show the actual backend error message
        const backendError = err.response?.data?.error || err.response?.data?.message || 'Failed to save team. Please try again.';
        setError(backendError);
        console.error('Backend error details:', err.response?.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Removed premature return to allow guest rendering
  /*
  if (!isAuthenticated) {
    return null; // Will redirect
  }
  */

  const teamPokemonCount = team.filter(s => s.pokemon).length;
  const selectedPokemonIds = team
    .filter(s => s.pokemon && s.pokemon.pokemonData)
    .map(s => s.pokemon!.pokemonData.id);

  return (
    <>
      <Head>
        <title>
          {teamId ? t('teams.editTeam', 'Edit Team') : t('teams.createTeam', 'Create Team')} | Pokemon Champion
        </title>
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {teamId ? t('teams.editTeam', 'Edit Team') : t('teamBuilder.title', 'Team Builder')}
                </h1>
              </div>
              <Button href="/teams/my" variant="secondary">
                {t('common.back', 'Back')}
              </Button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
                {successMessage}
              </div>
            )}

            {/* Step Indicator */}
            <div className="mb-6 flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-dark-text-tertiary'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary'}`}>
                  1
                </div>
                <span className="text-sm font-medium">{t('teamBuilder.step1', 'Pokemon Selection')}</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-dark-border" />
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-dark-text-tertiary'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-dark-bg-tertiary dark:text-dark-text-secondary'}`}>
                  2
                </div>
                <span className="text-sm font-medium">{t('teamBuilder.step2', 'Team Details')}</span>
              </div>
            </div>

            {/* Step 1: Pokemon Selection */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Team Slots */}
                <TeamSlots
                  team={team}
                  onSlotClick={handleSlotClick}
                  onRemovePokemon={handleRemovePokemon}
                  onTeamUpdate={setTeam}
                  activeSlot={activeSlot}
                />

                {/* Type Coverage Analysis */}
                <TeamTypeAnalysis team={team} />

                {/* Next Button */}
                <div className="flex gap-4">
                  <button
                    onClick={handleNextStep}
                    disabled={teamPokemonCount === 0}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {t('common.next', 'Next')}
                  </button>
                  <Button
                    href="/teams/my"
                    variant="secondary"
                    className="px-6 py-3"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Team Metadata */}
            {step === 2 && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Team Info */}
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
                    {t('teamBuilder.teamInfo', 'Team Information')}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                        {t('teamBuilder.teamName', 'Team Name')} *
                      </label>
                      <input
                        type="text"
                        id="teamName"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary"
                        placeholder={t('teamBuilder.teamNamePlaceholder', 'Enter team name...')}
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                        {t('teamBuilder.description', 'Description')} *
                      </label>
                      <MentionTextarea
                        value={teamDescription}
                        onChange={setTeamDescription}
                        placeholder={t('teamBuilder.descriptionPlaceholder', 'Describe your team... (Type @ to mention Pokemon, moves, items, or abilities)')}
                        rows={8}
                        maxLength={2000}
                      />
                    </div>

                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="w-5 h-5 text-primary-600 border-gray-300 dark:border-dark-border rounded focus:ring-primary-500"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-dark-text-secondary">
                          {t('teamBuilder.makePublic', 'Make this team public')}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleBackStep}
                    className="px-6 py-3 bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-tertiary dark:hover:text-dark-text-primary transition-colors font-medium"
                  >
                    {t('common.back', 'Back')}
                  </button>
                  <button
                    onClick={handleSaveTeam}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSaving
                      ? t('common.saving', 'Saving...')
                      : teamId
                        ? t('common.update', 'Update Team')
                        : t('common.save', 'Save Team')}
                  </button>
                  <Button
                    href="/teams/my"
                    variant="secondary"
                    className="px-6 py-3"
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pokemon Selector Modal */}
        {showPokemonSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                  {t('teamBuilder.selectPokemon', 'Select Pokemon')}
                </h2>
                <button
                  onClick={() => {
                    setShowPokemonSelector(false);
                    setActiveSlot(undefined);
                  }}
                  className="text-gray-400 dark:text-dark-text-tertiary hover:text-gray-600 dark:hover:text-dark-text-primary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PokemonSelector
                  onSelect={handlePokemonSelect}
                  selectedPokemonIds={selectedPokemonIds}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pokemon Configurator Modal */}
        {configuringPokemon && activeSlot !== undefined && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <PokemonConfigurator
                pokemonNationalNumber={configuringPokemon.nationalNumber}
                existingConfig={team[activeSlot]?.pokemon}
                onSave={handleConfigSave}
                onCancel={() => {
                  setConfiguringPokemon(null);
                  setActiveSlot(undefined);
                }}
              />
            </div>
          </div>
        )}
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
