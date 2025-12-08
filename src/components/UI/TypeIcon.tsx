import { useTranslation } from 'next-i18next';

interface TypeIconProps {
  type: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function TypeIcon({ type, size = 'md', className = '', showLabel = false }: TypeIconProps) {
  const { t } = useTranslation('common');
  const typeLower = type.toLowerCase();
  const sizeClass = SIZE_CLASSES[size];
  const typeLabel = t(`types.${typeLower}`, { defaultValue: type });

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <img
        src={`/types/${typeLower}.svg`}
        alt={typeLabel}
        title={typeLabel}
        className={`${sizeClass} object-contain`}
        onError={(e) => {
          console.error(`Failed to load type icon: ${type} (${typeLower})`);
          // Fallback to showing text badge if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
      {showLabel && <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{typeLabel}</span>}
    </span>
  );
}
