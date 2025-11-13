import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/Layout/Layout';
import { Tag, Calendar, User, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

const API_URL = getApiBaseUrl();

interface Article {
  id: string;
  slug: string;
  featuredImage: string | null;
  publishedAt: string;
  translations: Array<{
    language: 'en' | 'ja';
    title: string;
    content: string;
  }>;
  tags: string[];
  author: {
    username: string;
  };
}

interface NewsTag {
  slug: string;
  tagName: string;
}

export default function NewsListPage() {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const { tag } = router.query;

  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<NewsTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(
    typeof tag === 'string' ? tag : null
  );

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [selectedTag, i18n.language]);

  const loadTags = async () => {
    try {
      const response = await axios.get(`${API_URL}/news/tags/all`);
      setTags(response.data.tags || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        language: i18n.language,
      };

      if (selectedTag) {
        params.tag = selectedTag;
      }

      const response = await axios.get(`${API_URL}/news`, { params });
      setArticles(response.data.articles || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tagSlug: string) => {
    if (selectedTag === tagSlug) {
      setSelectedTag(null);
      router.push('/news', undefined, { shallow: true });
    } else {
      setSelectedTag(tagSlug);
      router.push(`/news?tag=${tagSlug}`, undefined, { shallow: true });
    }
  };

  const getTranslation = (article: Article) => {
    // Try to get the translation for the current language
    const translation = article.translations.find(t => t.language === i18n.language);

    // If not found, fallback to English
    if (!translation) {
      return article.translations.find(t => t.language === 'en') || article.translations[0];
    }

    return translation;
  };

  const hasTranslation = (article: Article, lang: string) => {
    return article.translations.some(t => t.language === lang);
  };

  // Generate preview from HTML content
  const getPreview = (htmlContent: string, maxLength: number = 150): string => {
    // Strip HTML tags
    const text = htmlContent.replace(/<[^>]*>/g, '');
    // Truncate to maxLength
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <Layout>
      <Head>
        <title>{t('news.title', 'News')} | Pokemon Champion</title>
        <meta name="description" content={t('news.description', 'Latest news and updates')} />
      </Head>

      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">{t('news.title', 'News')}</h1>

          {/* Tag Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold">{t('news.filterByTag', 'Filter by Tag')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTagClick('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('news.allArticles', 'All Articles')}
              </button>
              {tags.map(tag => (
                <button
                  key={tag.slug}
                  onClick={() => handleTagClick(tag.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag.slug
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag.tagName}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('common.loading', 'Loading...')}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">
                {selectedTag
                  ? t('news.noArticlesWithTag', 'No articles found with this tag')
                  : t('news.noArticles', 'No articles published yet')}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map(article => {
                const translation = getTranslation(article);
                return (
                  <Link key={article.id} href={`/news/${article.slug}`}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      {article.featuredImage && (
                        <img
                          src={`${API_URL.replace('/api', '')}${article.featuredImage}`}
                          alt={translation.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h2 className="text-xl font-bold mb-2 line-clamp-2">
                          {translation.title}
                        </h2>

                        {!hasTranslation(article, i18n.language) && i18n.language === 'ja' && (
                          <p className="text-sm text-amber-600 mb-2 italic">
                            {t('news.translationComingSoon', 'Japanese translation coming soon')}
                          </p>
                        )}

                        <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                          {getPreview(translation.content)}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User size={16} />
                              <span>{article.author.username}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-primary-600" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
