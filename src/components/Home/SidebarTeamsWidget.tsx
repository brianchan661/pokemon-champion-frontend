import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { TrendingUp, User } from 'lucide-react';
import { getApiBaseUrl } from '@/config/api';
import axios from 'axios';

interface SimpleTeam {
    id: string;
    name: string;
    authorName: string;
    pokemon: Array<{
        pokemon: {
            name: { en: string; ja: string };
            imageUrl: string;
        }
    }>;
    likes: number;
}

export const SidebarTeamsWidget = () => {
    const { t, i18n } = useTranslation('common');
    const [teams, setTeams] = useState<SimpleTeam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrendingTeams = async () => {
            try {
                const response = await axios.get(`${getApiBaseUrl()}/teams`, {
                    params: {
                        limit: 5,
                        sort: 'likes', // Assuming API supports sorting by likes for "trending"
                    },
                });

                // Handle different API response structures just in case
                const teamsData = response.data.teams || response.data || [];
                setTeams(Array.isArray(teamsData) ? teamsData.slice(0, 5) : []);
            } catch (error) {
                console.error('Failed to fetch trending teams:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingTeams();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border p-4 mb-8">
                <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold text-gray-900 dark:text-dark-text-primary">
                        {t('home.sidebar.trendingTeams', 'Trending Teams')}
                    </h3>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Hide widget if no teams available
    if (teams.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-100 dark:border-dark-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-gray-900 dark:text-dark-text-primary">
                            {t('home.sidebar.trendingTeams', 'Trending Teams')}
                        </h3>
                    </div>
                    <Link
                        href="/teams"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                        {t('common.viewAll', 'View All')}
                    </Link>
                </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-dark-border">
                {teams.map((team) => (
                    <Link
                        key={team.id}
                        href={`/teams/${team.id}`}
                        className="block p-4 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-gray-900 dark:text-dark-text-primary line-clamp-1 text-sm">
                                {team.name}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <span className="font-medium text-primary-600 mr-1">{team.likes || 0}</span> likes
                            </div>
                        </div>

                        <div className="flex items-center mb-2">
                            <User className="w-3 h-3 text-gray-400 mr-1" />
                            <div className="text-xs text-gray-500 dark:text-dark-text-secondary truncate">
                                {team.authorName || 'Unknown'}
                            </div>
                        </div>

                        {/* Pokemon minisprites preview */}
                        <div className="flex space-x-1 overflow-hidden">
                            {team.pokemon && team.pokemon.slice(0, 6).map((p, idx) => (
                                <div key={idx} className="w-6 h-6 relative bg-gray-100 dark:bg-dark-bg-primary rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-dark-border flex-shrink-0">
                                    {p.pokemon.imageUrl && (
                                        <img
                                            src={p.pokemon.imageUrl}
                                            alt={p.pokemon.name[i18n.language as 'en' | 'ja'] || 'Pokemon'}
                                            className="w-5 h-5 object-contain"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
