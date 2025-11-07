import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import axios from 'axios';

interface PremiumStats {
  activePremiumUsers: number;
  expiredPremiumUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  recentTransactionsByType: Array<{
    transaction_type: string;
    count: string;
  }>;
}

interface PendingActivation {
  id: number;
  eventType: string;
  supporterEmail: string;
  supporterName: string;
  amount: string;
  membershipLevel: string;
  createdAt: string;
  errorMessage: string | null;
}

interface Transaction {
  id: number;
  user_id: string | null;
  user_email: string | null;
  user_username: string | null;
  bmc_supporter_email: string;
  bmc_supporter_name: string;
  bmc_subscription_id: string | null;
  membership_level_name: string;
  transaction_type: string;
  amount: string | null;
  currency: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export const PremiumManagement = () => {
  const { t } = useTranslation('common');
  const [activeSection, setActiveSection] = useState<'stats' | 'pending' | 'transactions'>('stats');
  const [stats, setStats] = useState<PremiumStats | null>(null);
  const [pendingActivations, setPendingActivations] = useState<PendingActivation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/premium/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch premium stats:', err);
      setError('Failed to fetch premium statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending activations
  const fetchPendingActivations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/premium/pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingActivations(response.data.pendingActivations);
    } catch (err) {
      console.error('Failed to fetch pending activations:', err);
      setError('Failed to fetch pending activations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/premium/transactions?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to fetch transactions');
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
    } else if (activeSection === 'pending') {
      fetchPendingActivations();
    } else if (activeSection === 'transactions') {
      fetchTransactions();
    }
  }, [activeSection]);

  // Approve pending activation
  const handleApprove = async (webhookEventId: number, userId: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/premium/approve`,
        { webhookEventId, userId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(response.data.message);
      // Refresh pending list
      await fetchPendingActivations();
    } catch (err: any) {
      console.error('Failed to approve activation:', err);
      setError(err.response?.data?.error || 'Failed to approve activation');
    } finally {
      setLoading(false);
    }
  };

  // Revoke premium
  const handleRevoke = async (userId: string, reason: string) => {
    if (!confirm(`Are you sure you want to revoke premium from this user? Reason: ${reason}`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/premium/revoke/${userId}`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(response.data.message);
      // Refresh transactions list
      await fetchTransactions();
    } catch (err: any) {
      console.error('Failed to revoke premium:', err);
      setError(err.response?.data?.error || 'Failed to revoke premium');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveSection('stats')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'stats'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('admin.premium.sections.stats')}
          </button>
          <button
            onClick={() => setActiveSection('pending')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'pending'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('admin.premium.sections.pending')}
            {pendingActivations.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-600 text-white rounded-full">
                {pendingActivations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('transactions')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'transactions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('admin.premium.sections.transactions')}
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
          <div className="text-white text-lg">{t('admin.premium.loading')}</div>
        </div>
      )}

      {/* Stats Section */}
      {activeSection === 'stats' && stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.premium.stats.activePremium')}
            </h3>
            <p className="text-3xl font-bold text-white">{stats.activePremiumUsers}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.premium.stats.expiredPremium')}
            </h3>
            <p className="text-3xl font-bold text-yellow-400">{stats.expiredPremiumUsers}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.premium.stats.totalRevenue')}
            </h3>
            <p className="text-3xl font-bold text-green-400">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('admin.premium.stats.totalTransactions')}
            </h3>
            <p className="text-3xl font-bold text-blue-400">{stats.totalTransactions}</p>
          </div>

          {/* Recent Transactions by Type */}
          <div className="bg-gray-800 rounded-lg p-6 md:col-span-2 lg:col-span-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t('admin.premium.stats.recentByType')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.recentTransactionsByType.map((type) => (
                <div key={type.transaction_type} className="text-center">
                  <p className="text-2xl font-bold text-white">{type.count}</p>
                  <p className="text-sm text-gray-400">{type.transaction_type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Activations Section */}
      {activeSection === 'pending' && !loading && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('admin.premium.pending.title')}
          </h2>
          <p className="text-gray-300 mb-6">
            {t('admin.premium.pending.description')}
          </p>

          {pendingActivations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {t('admin.premium.pending.noPending')}
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActivations.map((activation) => (
                <div
                  key={activation.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Supporter Email</p>
                      <p className="text-white font-medium">{activation.supporterEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Supporter Name</p>
                      <p className="text-white">{activation.supporterName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className="text-white">${activation.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Membership Level</p>
                      <p className="text-white">{activation.membershipLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="text-white">
                        {new Date(activation.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {activation.errorMessage && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400">Error</p>
                        <p className="text-red-400">{activation.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Manual Approval Form */}
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const userId = formData.get('userId') as string;
                        if (userId) {
                          handleApprove(activation.id, userId);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        name="userId"
                        placeholder="User ID to link"
                        className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions Section */}
      {activeSection === 'transactions' && !loading && (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('admin.premium.transactions.title')}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    BMC Email
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Expires
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {transaction.user_email ? (
                        <div>
                          <div className="font-medium">{transaction.user_username}</div>
                          <div className="text-gray-400 text-xs">{transaction.user_email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      <div>
                        <div>{transaction.bmc_supporter_email}</div>
                        <div className="text-gray-400 text-xs">{transaction.bmc_supporter_name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.transaction_type === 'subscription_start' ? 'bg-green-900/50 text-green-300' :
                        transaction.transaction_type === 'renewal' ? 'bg-blue-900/50 text-blue-300' :
                        transaction.transaction_type === 'cancellation' ? 'bg-red-900/50 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {transaction.amount ? `$${transaction.amount}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {transaction.expires_at ? (
                        new Date(transaction.expires_at).toLocaleDateString()
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {transaction.user_id && transaction.transaction_type !== 'cancellation' && (
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for revoking premium:');
                            if (reason) {
                              handleRevoke(transaction.user_id!, reason);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {t('admin.premium.transactions.noTransactions')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
