import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalConfig } from '../contexts/GlobalConfigContext';
import { Layout } from '../components/Layout/Layout';
import { NewsManagement } from '../components/Admin/NewsManagement';
import { PremiumManagement } from '../components/Admin/PremiumManagement';
import { UserManagement } from '../components/Admin/UserManagement';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

const AdminPage = () => {
  const { t } = useTranslation('common');
  const { user, isLoading } = useAuth();
  const { refreshConfig } = useGlobalConfig();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'news' | 'premium' | 'users'>('settings');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [adsDisabled, setAdsDisabled] = useState(false);
  const [readOnlyMessage, setReadOnlyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheSuccess, setCacheSuccess] = useState('');
  const [cacheError, setCacheError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSettings();
      fetchReadOnlyStatus();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${getApiBaseUrl()}/admin/settings`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSettings(response.data.settings);
    } catch (err) {
      setError('Failed to fetch settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadOnlyStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${getApiBaseUrl()}/admin/read-only-mode`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReadOnlyMode(response.data.enabled);
      setReadOnlyMessage(response.data.message);

      // We can grab ads disabled from settings list, but for specific toggle state let's use global config endpoint or settings
      // Actually we are fetching settings list, so we can derive it from there, but separate endpoint is cleaner if we had one
      // For now let's reuse public config endpoint since we have it, or check settings list
      const configResponse = await axios.get(`${getApiBaseUrl()}/config`);
      setAdsDisabled(configResponse.data.adsDisabled);
    } catch (err) {
      console.error('Failed to fetch read-only status:', err);
    }
  };

  const toggleReadOnlyMode = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${getApiBaseUrl()}/admin/read-only-mode`,
        { enabled: !readOnlyMode },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setReadOnlyMode(!readOnlyMode);
      setSuccess(response.data.message);
      await refreshConfig(); // Sync global state
      fetchSettings();
    } catch (err) {
      setError('Failed to toggle read-only mode');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleAdsMode = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${getApiBaseUrl()}/admin/ads-mode`,
        { disabled: !adsDisabled },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAdsDisabled(!adsDisabled);
      setSuccess(response.data.message);
      await refreshConfig(); // Sync global state
      fetchSettings();
    } catch (err) {
      setError('Failed to toggle ads mode');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const clearCache = async (resource?: string) => {
    setClearingCache(true);
    setCacheError('');
    setCacheSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${getApiBaseUrl()}/admin/cache/clear`,
        resource ? { resource } : {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCacheSuccess(`${response.data.message} (${response.data.entriesRemoved} entries removed)`);
    } catch (err) {
      setCacheError('Failed to clear cache. Check that you are logged in as admin.');
      console.error(err);
    } finally {
      setClearingCache(false);
    }
  };

  const updateReadOnlyMessage = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${getApiBaseUrl()}/admin/settings/read_only_message`,
        { value: readOnlyMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Message updated successfully');
      await refreshConfig();
      fetchSettings();
    } catch (err) {
      setError('Failed to update message');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">{t('admin.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('admin.title')}</h1>
            <p className="text-gray-400">{t('admin.subtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
              >
                {t('admin.tabs.settings')}
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'news'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
              >
                {t('admin.tabs.news')}
              </button>
              <button
                onClick={() => setActiveTab('premium')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'premium'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
              >
                {t('admin.tabs.premium')}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
              >
                {t('admin.tabs.users')}
              </button>
            </nav>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* News Management Tab */}
          {activeTab === 'news' && (
            <NewsManagement />
          )}

          {/* Premium Management Tab */}
          {activeTab === 'premium' && (
            <PremiumManagement />
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <UserManagement />
          )}

          {/* System Settings Tab */}
          {activeTab === 'settings' && (
            <>
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">{t('admin.readOnlyMode.title')}</h2>
                <p className="text-gray-300 mb-6">
                  {t('admin.readOnlyMode.description')}
                </p>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{t('admin.readOnlyMode.status')}</h3>
                      <p className="text-sm text-gray-400">
                        {readOnlyMode ? t('admin.readOnlyMode.currentlyEnabled') : t('admin.readOnlyMode.currentlyDisabled')}
                      </p>
                    </div>
                    <button
                      onClick={toggleReadOnlyMode}
                      disabled={updating}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${readOnlyMode
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updating ? t('admin.readOnlyMode.updating') : readOnlyMode ? t('admin.readOnlyMode.disable') : t('admin.readOnlyMode.enable')}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('admin.readOnlyMode.userMessage')}
                    </label>
                    <p className="text-sm text-gray-400 mb-3">
                      {t('admin.readOnlyMode.userMessageDescription')}
                    </p>
                    <textarea
                      value={readOnlyMessage}
                      onChange={(e) => setReadOnlyMessage(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <button
                      onClick={updateReadOnlyMessage}
                      disabled={updating}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? t('admin.readOnlyMode.updating') : t('admin.readOnlyMode.updateMessage')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Ads Control</h2>
                <p className="text-gray-300 mb-6">
                  Globally disable all advertisements on the specific platform. Useful for debugging or cleaner experience during events.
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Ads Status</h3>
                    <p className="text-sm text-gray-400">
                      {adsDisabled ? 'Ads are currently DISABLED' : 'Ads are currently ENABLED'}
                    </p>
                  </div>
                  <button
                    onClick={toggleAdsMode}
                    disabled={updating}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${adsDisabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating ? 'Updating...' : adsDisabled ? 'Enable Ads' : 'Disable Ads'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Cache Control</h2>
                <p className="text-gray-300 mb-6">
                  Force-refresh the in-memory cache. Use this after running a scrape script to immediately serve updated data without restarting the server.
                </p>

                <div className="space-y-4">
                  {/* Clear All */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Clear All Caches</h3>
                      <p className="text-sm text-gray-400">Clears cached data for all resources (abilities, items, moves, pokemon, natures)</p>
                    </div>
                    <button
                      id="admin-cache-clear-all"
                      onClick={() => clearCache()}
                      disabled={clearingCache}
                      className="px-6 py-3 rounded-lg font-semibold transition-colors bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearingCache ? 'Clearing...' : '🗑️ Clear All'}
                    </button>
                  </div>

                  {/* Per-resource buttons */}
                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-sm text-gray-400 mb-3">Or clear a specific resource:</p>
                    <div className="flex flex-wrap gap-2">
                      {(['abilities', 'items', 'moves', 'pokemon', 'natures'] as const).map((resource) => (
                        <button
                          key={resource}
                          id={`admin-cache-clear-${resource}`}
                          onClick={() => clearCache(resource)}
                          disabled={clearingCache}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed capitalize"
                        >
                          {clearingCache ? '...' : resource}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result feedback */}
                  {cacheSuccess && (
                    <div className="mt-2 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded text-sm">
                      ✅ {cacheSuccess}
                    </div>
                  )}
                  {cacheError && (
                    <div className="mt-2 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded text-sm">
                      ❌ {cacheError}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">{t('admin.systemSettings.title')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">{t('admin.systemSettings.key')}</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">{t('admin.systemSettings.value')}</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">{t('admin.systemSettings.description')}</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-semibold">{t('admin.systemSettings.updated')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.map((setting) => (
                        <tr key={setting.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="py-3 px-4 text-white font-mono text-sm">
                            {setting.setting_key}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {setting.setting_value}
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-sm">
                            {setting.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-sm">
                            {new Date(setting.updated_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default AdminPage;
