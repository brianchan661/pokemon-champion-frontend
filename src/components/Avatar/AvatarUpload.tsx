import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslation } from 'next-i18next';
import { getApiBaseUrl } from '@/config/api';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onSuccess: (newAvatarUrl: string) => void;
  onError?: (error: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation('common');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Read and display the image
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlLoad = () => {
    if (!imageUrl) {
      onError?.('Please enter an image URL');
      return;
    }

    // Create a test image to validate URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageSrc(imageUrl);
    };
    img.onerror = () => {
      onError?.('Failed to load image from URL');
    };
    img.src = imageUrl;
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Initialize crop to a centered circle
    const size = Math.min(width, height);
    const cropSize = size * 0.6; // 60% of image

    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2
    });
  }, []);

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      onError?.('Please select an area to crop');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();

      if (mode === 'upload' && selectedFile) {
        // Upload mode: use the selected file
        formData.append('avatar', selectedFile);
      } else if (mode === 'url' && imageUrl) {
        // URL mode: fetch the image and convert to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        formData.append('avatar', blob, 'avatar.jpg');
      } else {
        throw new Error('No image selected');
      }

      // Add crop data
      formData.append('cropData', JSON.stringify({
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height
      }));

      const uploadResponse = await fetch(`${getApiBaseUrl()}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await uploadResponse.json();

      if (data.success && data.data.avatar_url) {
        onSuccess(data.data.avatar_url);
        // Reset state
        setImageSrc('');
        setSelectedFile(null);
        setImageUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.error || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      onError?.(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setImageSrc('');
    setSelectedFile(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 font-medium ${
            mode === 'upload'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('profile.uploadImage')}
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-4 py-2 font-medium ${
            mode === 'url'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('profile.useUrl')}
        </button>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && !imageSrc && (
        <div>
          <label
            htmlFor="avatar-upload"
            className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                {t('profile.dragDrop')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 10MB
              </p>
            </div>
          </label>
          <input
            ref={fileInputRef}
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && !imageSrc && (
        <div>
          <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 mb-1">
            {t('profile.imageUrl')}
          </label>
          <div className="flex gap-2">
            <input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={handleUrlLoad}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              {t('profile.loadImage')}
            </button>
          </div>
        </div>
      )}

      {/* Crop Area */}
      {imageSrc && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">{t('profile.cropAvatar')}</p>
            <div className="inline-block border-2 border-gray-200 rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-96"
                />
              </ReactCrop>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !completedCrop}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? t('profile.uploading') : t('profile.saveAvatar')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
