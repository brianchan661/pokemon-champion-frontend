import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '@/components/Layout/Layout';
import { Button, LoadingSpinner, ErrorMessage } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/config/api';
import { Avatar, AvatarUpload } from '@/components/Avatar';

const API_URL = getApiBaseUrl();

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

interface UserProfile {
  id: string;
  member_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  preferred_language: string;
  is_premium: boolean;
  created_at: string;
}

interface LinkedAccount {
  provider: string;
  provider_email: string;
  linked_at: string;
}

interface ProfileData {
  user: UserProfile;
  linked_accounts: LinkedAccount[];
}

interface TeamStats {
  totalTeams: number;
  publicTeams: number;
  privateTeams: number;
  totalLikes: number;
}

export default function ProfilePage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
    preferred_language: 'en'
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleUnlinkGoogle = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/auth/unlink/google`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('success', t('profile.googleUnlinkedSuccess'));
      setShowUnlinkConfirm(false);
    } catch (error: any) {
      showToast('error', error.response?.data?.error || t('profile.unlinkFailed'));
      setShowUnlinkConfirm(false);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await axios.get<{ success: boolean; data: ProfileData }>(
        `${API_URL}/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch team statistics
  const { data: teamStats } = useQuery({
    queryKey: ['teamStats'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await axios.get<{ success: boolean; data: { teams: any[]; count: number } }>(
        `${API_URL}/teams/my`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const teams = response.data.data.teams;
      const totalLikes = teams.reduce((sum, team) => sum + (team.likes || 0), 0);
      return {
        totalTeams: teams.length,
        publicTeams: teams.filter(t => t.isPublic).length,
        privateTeams: teams.filter(t => !t.isPublic).length,
        totalLikes
      } as TeamStats;
    },
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setErrors({});
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.error || t('profile.failedToUpdate') });
    },
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        username: profileData.user.username,
        avatar_url: profileData.user.avatar_url || '',
        preferred_language: profileData.user.preferred_language
      });
    }
  }, [profileData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) {
      newErrors.username = t('profile.usernameRequired');
    }
    if (formData.username.length < 2) {
      newErrors.username = t('profile.usernameMinLength');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        username: profileData.user.username,
        avatar_url: profileData.user.avatar_url || '',
        preferred_language: profileData.user.preferred_language
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t('profile.loadingProfile')} />
      </Layout>
    );
  }

  if (profileError) {
    return (
      <Layout>
        <ErrorMessage error={new Error(t('profile.failedToLoad'))} />
      </Layout>
    );
  }

  if (!profileData) return null;

  return (
    <>
      <Head>
        <title>{t('profile.title')} | Pokemon Champion</title>
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-100 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {t('profile.title')}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{t('profile.information')}</h2>
                    {!isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="secondary"
                        size="sm"
                      >
                        {t('profile.editProfile')}
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.username')}
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.username ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.username && (
                          <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                        )}
                      </div>

                      {/* Avatar Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('profile.avatar')}
                        </label>
                        <AvatarUpload
                          currentAvatarUrl={formData.avatar_url}
                          onSuccess={(newAvatarUrl) => {
                            setFormData({ ...formData, avatar_url: newAvatarUrl });
                            // Invalidate profile query to refresh the data
                            queryClient.invalidateQueries({ queryKey: ['profile'] });
                            showToast('success', t('profile.avatarUpdated'));
                          }}
                          onError={(error) => {
                            showToast('error', error);
                          }}
                        />
                      </div>

                      {/* Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('profile.language')}
                        </label>
                        <select
                          value={formData.preferred_language}
                          onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="en">{t('profile.languages.en')}</option>
                          <option value="ja">{t('profile.languages.ja')}</option>
                          <option value="zh-CN">{t('profile.languages.zh-CN')}</option>
                        </select>
                      </div>

                      {errors.submit && (
                        <ErrorMessage error={new Error(errors.submit)} />
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCancel}
                        >
                          {t('profile.cancel')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* Avatar */}
                      <div className="flex justify-center mb-4">
                        <Avatar
                          src={profileData.user.avatar_url}
                          alt={profileData.user.username}
                          fallbackText={profileData.user.username}
                          size="xl"
                          className="border-4 border-primary-200"
                        />
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">{t('profile.memberId')}</p>
                          <p className="font-medium text-gray-900">#{profileData.user.member_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('profile.username')}</p>
                          <p className="font-medium text-gray-900">{profileData.user.username}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">{t('profile.email')}</p>
                          <p className="font-medium text-gray-900">{profileData.user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('profile.language')}</p>
                          <p className="font-medium text-gray-900">
                            {t(`profile.languages.${profileData.user.preferred_language}`)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('profile.accountType')}</p>
                          <p className="font-medium text-gray-900">
                            {profileData.user.is_premium ? (
                              <span className="text-yellow-600">{t('profile.premium')} ⭐</span>
                            ) : (
                              t('profile.free')
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('profile.role')}</p>
                          <p className="font-medium text-gray-900 capitalize">{profileData.user.role}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t('profile.memberSince')}</p>
                          <p className="font-medium text-gray-900">
                            {new Date(profileData.user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Linked Accounts */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('profile.linkedAccounts')}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('profile.linkedAccountsDescription')}
                  </p>

                  <div className="space-y-3">
                    {/* Google Account */}
                    {profileData.linked_accounts.find(acc => acc.provider === 'google') ? (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">Google</p>
                            <p className="text-sm text-gray-500">
                              {profileData.linked_accounts.find(acc => acc.provider === 'google')?.provider_email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowUnlinkConfirm(true)}
                          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          {t('profile.unlink')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6 opacity-50" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <div>
                            <p className="font-medium text-gray-900">Google</p>
                            <p className="text-sm text-gray-500">{t('profile.notLinked')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const width = 500;
                            const height = 600;
                            const left = window.screen.width / 2 - width / 2;
                            const top = window.screen.height / 2 - height / 2;

                            // Open the OAuth initiation URL (not the callback)
                            // Add popup=true parameter so the callback knows it's in a popup
                            const popupUrl = `${API_URL}/auth/google?userId=${profileData.user.id}&popup=true`;

                            const popup = window.open(
                              popupUrl,
                              'oauth_popup_' + Date.now(),
                              `width=${width},height=${height},left=${left},top=${top}`
                            );

                            if (!popup) {
                              showToast('error', t('profile.popupBlocked'));
                              return;
                            }

                            // Try to focus the popup
                            try {
                              popup.focus();
                            } catch (e) {
                              // Silently fail if we can't focus
                            }

                            // Declare interval variable that both handlers can access
                            let checkForResults: ReturnType<typeof setInterval> | null = null;

                            // Listen for localStorage changes (main communication method)
                            const handleStorageChange = (e: StorageEvent) => {
                              if (e.key === 'oauth_link_result' && e.newValue) {
                                try {
                                  const result = JSON.parse(e.newValue);

                                  // Clear the polling interval
                                  if (checkForResults !== null) {
                                    clearInterval(checkForResults);
                                  }

                                  // Clear the result from localStorage
                                  localStorage.removeItem('oauth_link_result');

                                  // Refresh profile data
                                  queryClient.invalidateQueries({ queryKey: ['profile'] });

                                  // Remove event listeners
                                  window.removeEventListener('storage', handleStorageChange);
                                  window.removeEventListener('message', handleMessage);

                                  // Show success/error message
                                  if (result.success) {
                                    showToast('success', t('profile.googleLinkedSuccess'));
                                  } else if (result.error) {
                                    showToast('error', `${t('profile.linkFailed')}: ${result.error}`);
                                  }
                                } catch (err) {
                                  // Silently fail on parse error
                                }
                              }
                            };

                            // Listen for messages from the popup (backup method)
                            const handleMessage = (event: MessageEvent) => {
                              // Verify the origin
                              if (event.origin !== window.location.origin) {
                                return;
                              }

                              if (event.data?.type === 'oauth-link-complete') {
                                // Refresh profile data
                                queryClient.invalidateQueries({ queryKey: ['profile'] });

                                // Remove event listener
                                window.removeEventListener('message', handleMessage);
                                window.removeEventListener('storage', handleStorageChange);

                                // Show success/error message
                                if (event.data.success) {
                                  showToast('success', t('profile.googleLinkedSuccess'));
                                } else if (event.data.error) {
                                  showToast('error', `${t('profile.linkFailed')}: ${event.data.error}`);
                                }
                              }
                            };

                            window.addEventListener('storage', handleStorageChange);
                            window.addEventListener('message', handleMessage);

                            // Poll localStorage every second as fallback
                            let pollCount = 0;
                            const maxPolls = 120; // Poll for up to 2 minutes

                            checkForResults = setInterval(() => {
                              pollCount++;

                              // Check localStorage for result
                              const storedResult = localStorage.getItem('oauth_link_result');

                              if (storedResult) {
                                if (checkForResults !== null) {
                                  clearInterval(checkForResults);
                                }
                                window.removeEventListener('message', handleMessage);
                                window.removeEventListener('storage', handleStorageChange);

                                try {
                                  const result = JSON.parse(storedResult);
                                  localStorage.removeItem('oauth_link_result');

                                  // Refresh profile data
                                  queryClient.invalidateQueries({ queryKey: ['profile'] });

                                  // Show success/error message
                                  if (result.success) {
                                    showToast('success', t('profile.googleLinkedSuccess'));
                                  } else if (result.error) {
                                    showToast('error', `${t('profile.linkFailed')}: ${result.error}`);
                                  }
                                } catch (err) {
                                  queryClient.invalidateQueries({ queryKey: ['profile'] });
                                }
                              } else if (pollCount >= maxPolls) {
                                if (checkForResults !== null) {
                                  clearInterval(checkForResults);
                                }
                                window.removeEventListener('message', handleMessage);
                                window.removeEventListener('storage', handleStorageChange);
                                showToast('error', t('profile.oauthTimeout'));
                              }
                            }, 1000); // Check every second
                          }}
                          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                        >
                          {t('profile.linkAccount')}
                        </button>
                      </div>
                    )}

                    {/* Display other linked accounts (local, etc.) */}
                    {profileData.linked_accounts
                      .filter(acc => acc.provider !== 'google')
                      .map((account, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            {account.provider === 'local' ? (
                              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {account.provider === 'local' ? 'Email' : account.provider}
                              </p>
                              <p className="text-sm text-gray-500">{account.provider_email || 'N/A'}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {t('profile.linked')} {new Date(account.linked_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Team Stats */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.teamStatistics')}</h3>
                  {teamStats ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t('profile.totalTeams')}</span>
                        <span className="text-lg font-bold text-primary-600">{teamStats.totalTeams}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t('profile.publicTeams')}</span>
                        <span className="text-lg font-bold text-green-600">{teamStats.publicTeams}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t('profile.privateTeams')}</span>
                        <span className="text-lg font-bold text-gray-600">{teamStats.privateTeams}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{t('profile.totalLikes')}</span>
                          <span className="text-lg font-bold text-red-500">{teamStats.totalLikes} ❤️</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <LoadingSpinner />
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.quickActions')}</h3>
                  <div className="space-y-2">
                    <Button href="/teams/my" variant="secondary" className="w-full">
                      {t('profile.myTeams')}
                    </Button>
                    <Button href="/teams/create" variant="primary" className="w-full">
                      {t('profile.createTeam')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>

      {/* Unlink Confirmation Modal */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('profile.unlinkGoogleTitle')}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {t('profile.unlinkGoogleMessage')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowUnlinkConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleUnlinkGoogle}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('profile.unlinkAccount')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-slide-up">
          <div
            className={`rounded-lg shadow-lg p-4 min-w-[320px] max-w-md ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    toast.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToast(null)}
                className={`ml-4 inline-flex flex-shrink-0 ${
                  toast.type === 'success'
                    ? 'text-green-500 hover:text-green-700'
                    : 'text-red-500 hover:text-red-700'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
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
