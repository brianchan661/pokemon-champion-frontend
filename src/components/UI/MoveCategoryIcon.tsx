import Image from 'next/image';
import { useTranslation } from 'next-i18next';

export type MoveCategory = 'physical' | 'special' | 'status';

interface MoveCategoryIconProps {
  category: MoveCategory;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

/**
 * Move category icon component
 * Displays physical/special/status icons from PokemonDB
 */
export function MoveCategoryIcon({
  category,
  size = 20,
  className = '',
  showLabel = false
}: MoveCategoryIconProps) {
  const { t } = useTranslation('common');
  const iconPath = `/images/moves/${category}.png`;
  const label = t(`moves.categories.${category}`, { defaultValue: category });

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Image
        src={iconPath}
        alt={label}
        width={size}
        height={size}
        className="inline-block"
        style={{ width: 'auto', height: 'auto' }}
      />
      {showLabel && (
        <span className="text-xs font-medium">{label}</span>
      )}
    </div>
  );
}
