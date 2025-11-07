import { useTranslation } from 'next-i18next';
import { memo, useMemo, useState, useCallback } from 'react';

// TODO: Import from shared package once PokemonType is defined
type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

interface TypeIconProps {
  type: PokemonType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
} as const;

const TYPE_COLORS: Record<PokemonType, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-cyan-400',
  fighting: 'bg-orange-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-700',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-600',
  dark: 'bg-gray-700',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-400',
};

/**
 * TypeIcon component displays Pokemon type icons with optional labels
 * Includes fallback UI for failed image loads and full accessibility support
 */
export const TypeIcon = memo(function TypeIcon({ 
  type, 
  size = 'md', 
  className = '', 
  showLabel = false 
}: TypeIconProps) {
  const { t } = useTranslation('common');
  const [imageError, setImageError] = useState(false);
  
  // Memoize all computed values to prevent unnecessary recalculations
  const { typeLower, sizeClass, typeLabel, iconPath, typeColor } = useMemo(() => {
    const lower = type.toLowerCase();
    return {
      typeLower: lower,
      sizeClass: SIZE_CLASSES[size],
      typeLabel: t(`types.${lower}`, { defaultValue: type }),
      iconPath: `/types/${lower}.svg`,
      typeColor: TYPE_COLORS[type]
    };
  }, [type, size, t]);

  // Memoize error handler to prevent recreation on each render
  const handleImageError = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to load type icon: ${type}`);
    }
    setImageError(true);
  }, [type]);

  return (
    <span 
      className={`inline-flex items-center gap-1 ${className}`}
      role="img"
      aria-label={`${typeLabel} type`}
    >
      {imageError ? (
        // Fallback: colored badge with first letter
        <span 
          className={`${sizeClass} ${typeColor} rounded-full flex items-center justify-center text-white text-xs font-bold uppercase`}
          title={typeLabel}
          aria-hidden="true"
        >
          {type.charAt(0)}
        </span>
      ) : (
        <img
          src={iconPath}
          alt="" // Empty alt since parent span has aria-label
          title={typeLabel}
          className={`${sizeClass} object-contain`}
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          onError={handleImageError}
        />
      )}
      {showLabel && (
        <span className="text-sm font-medium" aria-hidden="true">
          {typeLabel}
        </span>
      )}
    </span>
  );
});

TypeIcon.displayName = 'TypeIcon';
