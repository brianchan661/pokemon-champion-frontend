import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { NewsArticleForm } from './NewsArticleForm';
import { Button } from '@/components/UI';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Article {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'hidden';
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  translations: Array<{
    language: 'en' | 'ja';
    title: string;
    content: string;
  }>;
  tags: string[];
  author: {
    id: string;
    username: string;
  };
}

export function NewsManagement() {
  const { t } = useTranslation('common');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'hidden'>('all');

  useEffect(() => {
    if (view === 'list') {
      loadArticles();
    }
  }, [view, filterStatus]);

  const loadArticles = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await axios.get(`${API_URL}/admin/news`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setArticles(response.data.articles || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/admin/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      loadArticles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete article');
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setView('edit');
  };

  const handleSaveComplete = () => {
    setView('list');
    setEditingArticle(null);
    loadArticles();
  };

  const handleCancel = () => {
    setView('list');
    setEditingArticle(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-200 text-gray-700',
      published: 'bg-green-200 text-green-700',
      hidden: 'bg-yellow-200 text-yellow-700',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTitle = (article: Article, language: 'en' | 'ja' = 'en') => {
    const translation = article.translations.find(t => t.language === language);
    return translation?.title || 'Untitled';
  };

  if (view === 'create') {
    return (
      <NewsArticleForm
        onSave={handleSaveComplete}
        onCancel={handleCancel}
      />
    );
  }

  if (view === 'edit' && editingArticle) {
    return (
      <NewsArticleForm
        article={editingArticle}
        onSave={handleSaveComplete}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">News Articles</h2>
        <Button onClick={() => setView('create')}>
          <Plus size={18} className="mr-2" />
          Create Article
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No articles found. Create your first article to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map(article => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {getTitle(article, 'en')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTitle(article, 'ja')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{article.author.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString()
                        : new Date(article.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
