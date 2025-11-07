import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { TipTapEditor } from '@/components/Editor/TipTapEditor';
import { ArticleContent } from '@/components/Editor/ArticleContent';
import { Button } from '@/components/UI';
import { Upload, X, Eye, Edit3 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ArticleTranslation {
  language: 'en' | 'ja';
  title: string;
  content: string;
}

interface NewsArticleFormProps {
  article?: {
    id: string;
    featuredImage: string | null;
    status: 'draft' | 'published' | 'hidden';
    translations: ArticleTranslation[];
    tags: string[];
  };
  onSave: () => void;
  onCancel: () => void;
}

export function NewsArticleForm({ article, onSave, onCancel }: NewsArticleFormProps) {
  const { t } = useTranslation('common');
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ja'>('en');
  const [status, setStatus] = useState<'draft' | 'published' | 'hidden'>(article?.status || 'draft');
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage || '');
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<Array<{ slug: string; tagName: string }>>([]);

  const [translations, setTranslations] = useState<ArticleTranslation[]>(
    article?.translations || [
      { language: 'en', title: '', content: '' },
      { language: 'ja', title: '', content: '' },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load available tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/admin/news/tags/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableTags(response.data.tags || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  // Get current translation
  const currentTranslation = translations.find(t => t.language === activeLanguage)!;

  // Update translation
  const updateTranslation = (field: keyof ArticleTranslation, value: string) => {
    setTranslations(translations.map(t =>
      t.language === activeLanguage ? { ...t, [field]: value } : t
    ));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
        setUploadingImage(false);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size too large. Maximum size is 5MB.');
        setUploadingImage(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('authToken');
      console.log('Uploading image:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');

      const response = await axios.post(`${API_URL}/admin/news/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);
      setFeaturedImage(response.data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to upload image';
      setError(errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Handle save
  const handleSave = async () => {
    // Validate - only English is required
    const enTranslation = translations.find(t => t.language === 'en');

    if (!enTranslation?.title || !enTranslation?.content) {
      setError('English translation is required (title and content)');
      return;
    }

    // Filter out empty translations (Japanese can be optional)
    const validTranslations = translations.filter(
      t => t.title.trim() && t.content.trim()
    );

    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        status,
        featuredImage: featuredImage || null,
        translations: validTranslations,
        tags,
      };

      if (article) {
        // Update existing article
        await axios.put(`${API_URL}/admin/news/${article.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new article
        await axios.post(`${API_URL}/admin/news`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {article ? 'Edit Article' : 'Create New Article'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Status */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Featured Image */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Featured Image
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Recommended: 1200x800 pixels (3:2 ratio). Max 5MB. Formats: JPEG, PNG, GIF, WebP.
        </p>
        {featuredImage ? (
          <div className="relative inline-block">
            <img src={`${API_URL.replace('/api', '')}${featuredImage}`} alt="Featured" className="h-32 rounded-lg" />
            <button
              type="button"
              onClick={() => setFeaturedImage('')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
              id="featured-image-upload"
            />
            <label
              htmlFor="featured-image-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer disabled:opacity-50"
            >
              <Upload size={18} />
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </label>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add a tag"
            list="available-tags"
          />
          <datalist id="available-tags">
            {availableTags.map(tag => (
              <option key={tag.slug} value={tag.slug}>
                {tag.tagName}
              </option>
            ))}
          </datalist>
          <Button onClick={handleAddTag} variant="secondary">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-primary-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Language Tabs and Preview Toggle */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveLanguage('en')}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeLanguage === 'en'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveLanguage('ja')}
              className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeLanguage === 'ja'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              日本語
            </button>
          </nav>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                !showPreview
                  ? 'bg-white text-primary-600 border-t border-x border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                showPreview
                  ? 'bg-white text-primary-600 border-t border-x border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode */}
      {!showPreview ? (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title ({activeLanguage.toUpperCase()}) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentTranslation.title}
              onChange={e => updateTranslation('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Article title"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content ({activeLanguage.toUpperCase()}) <span className="text-red-500">*</span>
            </label>
            <TipTapEditor
              content={currentTranslation.content}
              onChange={content => updateTranslation('content', content)}
              placeholder="Write your article content here..."
            />
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="bg-gray-50 rounded-lg p-8 min-h-[500px]">
          {/* Preview Header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            {/* Featured Image Preview */}
            {featuredImage && (
              <div className="w-full h-96 relative">
                <img
                  src={`${API_URL.replace('/api', '')}${featuredImage}`}
                  alt={currentTranslation.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <div className="p-8">
              {/* Tags Preview */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Title Preview */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {currentTranslation.title || 'Untitled Article'}
              </h1>

              {/* Meta Info Preview */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span>Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{new Date().toLocaleDateString(activeLanguage, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    status === 'published' ? 'bg-green-100 text-green-800' :
                    status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Content Preview */}
              <div className="prose prose-lg max-w-none">
                {currentTranslation.content ? (
                  <ArticleContent content={currentTranslation.content} />
                ) : (
                  <p className="text-gray-400 italic">No content yet. Start writing to see the preview.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
        </Button>
      </div>
    </div>
  );
}
