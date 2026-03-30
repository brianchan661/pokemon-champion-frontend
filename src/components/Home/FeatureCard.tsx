import Link from 'next/link';
import { memo, useMemo, useState } from 'react';
import { FeatureCardProps } from '@/types/home';
import { getFeatureGradient, getFeatureAccent } from '@/constants/gradients';

export const FeatureCard = memo(({
  href,
  title,
  backgroundImage
}: FeatureCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const gradientFallback = useMemo(() => getFeatureGradient(backgroundImage), [backgroundImage]);
  const accentColor = useMemo(() => getFeatureAccent(backgroundImage), [backgroundImage]);

  return (
    <Link
      href={href}
      className="group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
      aria-label={`Navigate to ${title} section`}
    >
      <div className="relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 h-64">
        {/* Gradient fallback background */}
        <div className={`absolute inset-0 ${gradientFallback}`} />

        {/* Background image */}
        {!imageError && (
          <img
            src={backgroundImage}
            alt={`${title} feature illustration`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300" />

        {/* Accent border — slides up on hover */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${accentColor} transform translate-y-full group-hover:translate-y-0 transition-transform duration-300`} />

        {/* Content */}
        <div className="relative z-10 flex items-end justify-center h-full p-6">
          <h3 className="text-2xl font-bold text-white text-center drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
});

FeatureCard.displayName = 'FeatureCard';
