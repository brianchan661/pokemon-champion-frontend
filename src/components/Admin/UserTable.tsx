import { useTranslation } from 'next-i18next';

interface User {
  id: string;
  member_id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_premium: boolean;
  account_status: string;
  email_verified: boolean;
  created_at: string;
  teams_count: number;
}

interface UserTableProps {
  users: User[];
  onUserClick: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const UserTable = ({ users, onUserClick, onDelete }: UserTableProps) => {
  const { t } = useTranslation('common');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/50 text-purple-300';
      case 'user':
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/50 text-green-300';
      case 'suspended':
        return 'bg-orange-900/50 text-orange-300';
      case 'banned':
        return 'bg-red-900/50 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              ID
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Username
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Email
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Role
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Status
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Teams
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Joined
            </th>
            <th className="text-left py-3 px-4 text-gray-300 font-semibold text-sm">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-700 hover:bg-gray-750 cursor-pointer"
              onClick={() => onUserClick(user.id)}
            >
              <td className="py-3 px-4 text-gray-300 text-sm font-mono">
                #{user.member_id}
              </td>
              <td className="py-3 px-4 text-white text-sm">
                <div className="flex items-center gap-2">
                  <span>{user.username}</span>
                  {user.is_premium && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-300 rounded">
                      Premium
                    </span>
                  )}
                  {!user.email_verified && (
                    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                      Unverified
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-gray-300 text-sm">
                {user.email}
              </td>
              <td className="py-3 px-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(user.account_status)}`}>
                  {user.account_status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-300 text-sm">
                {user.teams_count}
              </td>
              <td className="py-3 px-4 text-gray-400 text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUserClick(user.id);
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium mr-3"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(user.id);
                  }}
                  className="text-red-400 hover:text-red-300 text-xs font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No users found
        </div>
      )}
    </div>
  );
};
