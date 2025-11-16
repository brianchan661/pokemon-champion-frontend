import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-32 h-32 text-4xl'
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallbackText,
  className = ''
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Generate initials from alt text or fallbackText
  const getInitials = () => {
    const text = fallbackText || alt;
    const words = text.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const shouldShowImage = src && !imageError;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: !shouldShowImage
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : undefined
      }}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span className="text-white font-semibold select-none">
          {getInitials()}
        </span>
      )}
    </div>
  );
};
