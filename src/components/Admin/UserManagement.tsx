import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { UserTable } from './UserTable';
import { UserDetailModal } from './UserDetailModal';
import { ConfirmationModal } from '../UI/ConfirmationModal';
import { getApiBaseUrl } from '@/config/api';

interface UserManagementStats {
  totalUsers: number;
  roleStats: { [key: string]: number };
  statusStats: { [key: string]: number };
  premiumUsers: number;
  verifiedUsers: number;
  recentSignups: number;
}

interface User {
  id: string;
  member_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  preferred_language: string;
  is_premium: boolean;
  subscription_expiry: string | null;
  account_status: string;
  suspended_at: string | null;
  banned_at: string | null;
  status_reason: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  teams_count: number;
}

interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_username: string;
  target_user_id: string | null;
  target_username: string | null;
  action: string;
  reason: string | null;
  metadata: any;
  created_at: string;
}

export const UserManagement = () => {
  const { t } = useTranslation('common');
  const [activeSection, setActiveSection] = useState<'stats' | 'users' | 'audit'>('users');
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [premiumFilter, setPremiumFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${getApiBaseUrl()}/admin/users/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      setError('Failed to fetch user statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const params: any = {
        limit,
        offset: (page - 1) * limit
      };

      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.accountStatus = statusFilter;
      if (premiumFilter) params.isPremium = premiumFilter === 'true';

      const response = await axios.get(
        `${getApiBaseUrl()}/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit log
  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${getApiBaseUrl()}/admin/users/audit-log?limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAuditLog(response.data.auditLog);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
      setError('Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  };

  // Load data when section changes
  useEffect(() => {
    setError('');
    setSuccess('');

    if (activeSection === 'stats') {
      fetchStats();
    } else if (activeSection === 'users') {
      fetchUsers();
    } else if (activeSection === 'audit') {
      fetchAuditLog();
    }
  }, [activeSection]);

  // Reload users when filters or page changes
  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
    }
  }, [search, roleFilter, statusFilter, premiumFilter, page]);

  const handleUserClick = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    // Refresh users list
    if (activeSection === 'users') {
      fetchUsers();
    }
  };

  const handleUserUpdated = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `${getApiBaseUrl()}/admin/users/${userToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: 'Admin requested deletion' }
        }
      );

      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 5000);

      // Refresh list
      fetchUsers();
      // Refresh stats if we are deleting (optional but good)
      fetchStats();

      // Close modal
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveSection('stats')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === 'stats'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
          >
            {t('admin.users.sections.stats')}
          </button>
          <button
            onClick={() => setActiveSection('users')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === 'users'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
          >
            {t('admin.users.sections.users')}
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
              {total}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('audit')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === 'audit'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
          >
            {t('admin.users.sections.auditLog')}
          </button>
        </nav>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-white text-lg">{t('admin.users.loading')}</div>
        </div>
      )}

      {/* Stats Section */}
      {activeSection === 'stats' && stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.totalUsers')}
            </h3>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.adminUsers')}
            </h3>
            <p className="text-3xl font-bold text-purple-400">{stats.roleStats.admin || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.premiumUsers')}
            </h3>
            <p className="text-3xl font-bold text-yellow-400">{stats.premiumUsers}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.verifiedUsers')}
            </h3>
            <p className="text-3xl font-bold text-green-400">{stats.verifiedUsers}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.suspendedUsers')}
            </h3>
            <p className="text-3xl font-bold text-orange-400">{stats.statusStats.suspended || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.bannedUsers')}
            </h3>
            <p className="text-3xl font-bold text-red-400">{stats.statusStats.banned || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.users.stats.recentSignups')}
            </h3>
            <p className="text-3xl font-bold text-blue-400">{stats.recentSignups}</p>
            <p className="text-sm text-gray-400 mt-1">Last 7 days</p>
          </div>
        </div>
      )}

      {/* Users List Section */}
      {activeSection === 'users' && !loading && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('admin.users.list.title')}
          </h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder={t('admin.users.list.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>

            <select
              value={premiumFilter}
              onChange={(e) => {
                setPremiumFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              <option value="true">Premium Only</option>
              <option value="false">Free Only</option>
            </select>
          </div>

          {/* User Table */}
          {/* User Table */}
          <UserTable
            users={users}
            onUserClick={handleUserClick}
            onDelete={handleDeleteUser}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center px-4 text-white">
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Section */}
      {activeSection === 'audit' && !loading && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('admin.users.auditLog.title')}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Admin
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Target User
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {log.admin_username}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {log.target_username || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditLog.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No audit log entries found
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmLabel="Delete User"
        isDestructive={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};
