import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/Layout/Layout';
import { ArticleContent } from '@/components/Editor/ArticleContent';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';
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

interface NewsDetailPageProps {
  article: Article | null;
  error?: string;
}

export default function NewsDetailPage({ article, error }: NewsDetailPageProps) {
  const { t, i18n } = useTranslation('common');

  if (error || !article) {
    return (
      <Layout>
        <Head>
          <title>{t('news.articleNotFound', 'Article Not Found')} | Pokemon Champion</title>
        </Head>
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t('news.articleNotFound', 'Article Not Found')}
              </h1>
              <p className="text-gray-600 mb-6">
                {error || t('news.articleNotFoundDesc', 'The article you are looking for does not exist or has been removed.')}
              </p>
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <ArrowLeft size={20} />
                {t('news.backToNews', 'Back to News')}
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Try to get translation for current language, fallback to English
  const requestedTranslation = article.translations.find(t => t.language === i18n.language);
  const translation = requestedTranslation ||
    article.translations.find(t => t.language === 'en') ||
    article.translations[0];

  const hasRequestedTranslation = !!requestedTranslation;

  return (
    <Layout>
      <Head>
        <title>{translation.title} | Pokemon Champion</title>
        <meta name="description" content={translation.title} />
        {article.featuredImage && (
          <meta property="og:image" content={`${API_URL.replace('/api', '')}${article.featuredImage}`} />
        )}
      </Head>

      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft size={20} />
            {t('news.backToNews', 'Back to News')}
          </Link>

          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Featured Image */}
            {article.featuredImage && (
              <div className="w-full h-96 relative">
                <img
                  src={`${API_URL.replace('/api', '')}${article.featuredImage}`}
                  alt={translation.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <div className="p-8">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map(tag => (
                  <Link key={tag} href={`/news?tag=${tag}`}>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 cursor-pointer">
                      {tag}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {translation.title}
              </h1>

              {/* Translation Notice */}
              {!hasRequestedTranslation && i18n.language === 'ja' && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">
                        {t('news.translationNotAvailable', 'Japanese translation is not available yet. Showing English version. Translation will be available soon.')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <span>{article.author.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <span>{new Date(article.publishedAt).toLocaleDateString(i18n.language, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <ArticleContent content={translation.content} />
              </div>
            </div>
          </article>

          {/* Back to News Button */}
          <div className="mt-8 text-center">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <ArrowLeft size={20} />
              {t('news.backToNews', 'Back to News')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const slug = params?.slug as string;

  try {
    const response = await axios.get(`${API_URL}/news/${slug}`, {
      params: { language: locale },
    });

    return {
      props: {
        article: response.data,
        ...(await serverSideTranslations(locale || 'en', ['common'])),
      },
    };
  } catch (error: any) {
    return {
      props: {
        article: null,
        error: error.response?.data?.error || 'Article not found',
        ...(await serverSideTranslations(locale || 'en', ['common'])),
      },
    };
  }
};
