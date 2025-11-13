import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onUserUpdated: (message: string) => void;
}

interface UserDetail {
  id: string;
  member_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  preferred_language: string;
  is_premium: boolean;
  subscription_id: string | null;
  subscription_expiry: string | null;
  account_status: string;
  suspended_at: string | null;
  banned_at: string | null;
  status_reason: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStatistics {
  teamsCount: number;
  publicTeamsCount: number;
  privateTeamsCount: number;
  totalLikesReceived: number;
  commentsCount: number;
  linkedAccountsCount: number;
}

interface LinkedAccount {
  provider: string;
  provider_id: string;
  provider_email: string | null;
}

export const UserDetailModal = ({ userId, onClose, onUserUpdated }: UserDetailModalProps) => {
  const { t } = useTranslation('common');
  const [user, setUser] = useState<UserDetail | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action states
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${getApiBaseUrl()}/admin/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUser(response.data.user);
      setStatistics(response.data.statistics);
      setLinkedAccounts(response.data.linkedAccounts || []);
      setNewRole(response.data.user.role);
      setNewStatus(response.data.user.account_status);
    } catch (err) {
      console.error('Failed to fetch user detail:', err);
      setError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!newRole || newRole === user?.role) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.put(
        `${getApiBaseUrl()}/admin/users/${userId}/role`,
        { role: newRole, reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onUserUpdated(`User role changed to ${newRole}`);
      setShowRoleChange(false);
      setReason('');
      await fetchUserDetail();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === user?.account_status) return;

    if ((newStatus === 'suspended' || newStatus === 'banned') && !reason) {
      setError('Reason is required for suspending or banning a user');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.put(
        `${getApiBaseUrl()}/admin/users/${userId}/status`,
        { status: newStatus, reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onUserUpdated(`User account status changed to ${newStatus}`);
      setShowStatusChange(false);
      setReason('');
      await fetchUserDetail();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change account status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePremium = async (newPremiumStatus: boolean) => {
    if (!user) return;

    const confirmMessage = newPremiumStatus
      ? `Grant premium status to ${user.username}? This is for testing purposes.`
      : `Revoke premium status from ${user.username}?`;

    if (!confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.put(
        `${getApiBaseUrl()}/admin/users/${userId}/premium`,
        { isPremium: newPremiumStatus, reason: 'Admin testing' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onUserUpdated(`Premium status ${newPremiumStatus ? 'granted' : 'revoked'}`);
      await fetchUserDetail();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle premium status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="text-white text-lg">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Member ID</p>
                <p className="text-white font-mono">#{user.member_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Username</p>
                <p className="text-white">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Preferred Language</p>
                <p className="text-white">{user.preferred_language.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email Verified</p>
                <p className="text-white">
                  {user.email_verified ? (
                    <span className="text-green-400">✓ Verified</span>
                  ) : (
                    <span className="text-red-400">✗ Not Verified</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Member Since</p>
                <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Role Management */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Role</h3>
              <button
                onClick={() => setShowRoleChange(!showRoleChange)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                {showRoleChange ? 'Cancel' : 'Change Role'}
              </button>
            </div>

            {!showRoleChange ? (
              <div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-900/50 text-purple-300'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {user.role}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason for role change (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleRoleChange}
                  disabled={actionLoading || newRole === user.role}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            )}
          </div>

          {/* Account Status Management */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Account Status</h3>
              <button
                onClick={() => setShowStatusChange(!showStatusChange)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                {showStatusChange ? 'Cancel' : 'Change Status'}
              </button>
            </div>

            {!showStatusChange ? (
              <div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  user.account_status === 'active'
                    ? 'bg-green-900/50 text-green-300'
                    : user.account_status === 'suspended'
                    ? 'bg-orange-900/50 text-orange-300'
                    : 'bg-red-900/50 text-red-300'
                }`}>
                  {user.account_status}
                </span>
                {user.status_reason && (
                  <p className="text-gray-400 text-sm mt-2">
                    Reason: {user.status_reason}
                  </p>
                )}
                {user.suspended_at && (
                  <p className="text-gray-400 text-sm mt-1">
                    Suspended on: {new Date(user.suspended_at).toLocaleString()}
                  </p>
                )}
                {user.banned_at && (
                  <p className="text-gray-400 text-sm mt-1">
                    Banned on: {new Date(user.banned_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
                {(newStatus === 'suspended' || newStatus === 'banned') && (
                  <input
                    type="text"
                    placeholder="Reason (required for suspend/ban)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <button
                  onClick={handleStatusChange}
                  disabled={actionLoading || newStatus === user.account_status}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            )}
          </div>

          {/* Premium Status */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Premium Status</h3>
              <div className="flex gap-2">
                {!user.is_premium ? (
                  <button
                    onClick={() => handleTogglePremium(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {actionLoading ? 'Processing...' : 'Grant Premium'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleTogglePremium(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {actionLoading ? 'Processing...' : 'Revoke Premium'}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Is Premium</p>
                <p className="text-white">
                  {user.is_premium ? (
                    <span className="text-yellow-400">✓ Premium</span>
                  ) : (
                    <span className="text-gray-400">Free</span>
                  )}
                </p>
              </div>
              {user.subscription_expiry && (
                <div>
                  <p className="text-sm text-gray-400">Expires</p>
                  <p className="text-white">{new Date(user.subscription_expiry).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Note: Admin-granted premium has no expiry date and is for testing purposes only.
            </p>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Total Teams</p>
                  <p className="text-2xl font-bold text-white">{statistics.teamsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Public Teams</p>
                  <p className="text-2xl font-bold text-green-400">{statistics.publicTeamsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Private Teams</p>
                  <p className="text-2xl font-bold text-gray-400">{statistics.privateTeamsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Likes Received</p>
                  <p className="text-2xl font-bold text-red-400">{statistics.totalLikesReceived}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Comments Made</p>
                  <p className="text-2xl font-bold text-blue-400">{statistics.commentsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Linked Accounts</p>
                  <p className="text-2xl font-bold text-purple-400">{statistics.linkedAccountsCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked Accounts */}
          {linkedAccounts.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Linked Accounts</h3>
              <div className="space-y-2">
                {linkedAccounts.map((account, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded capitalize">
                      {account.provider}
                    </span>
                    <span className="text-white">
                      {account.provider_email || account.provider_id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
