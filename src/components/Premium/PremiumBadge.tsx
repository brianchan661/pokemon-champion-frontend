import { Sparkles } from 'lucide-react';
import { useTranslation } from 'next-i18next';

interface PremiumBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Premium badge component to display user's premium status
 */
export function PremiumBadge({
  size = 'md',
  showLabel = true,
  className = ''
}: PremiumBadgeProps) {
  const { t } = useTranslation('common');

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-0.5',
    md: 'px-2 py-1 text-sm gap-1',
    lg: 'px-3 py-1.5 text-base gap-1.5'
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 16
  };

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm ${className}`}
      title={t('premium.badge', 'Premium Member')}
    >
      <Sparkles size={iconSizes[size]} className="fill-white" />
      {showLabel && <span>{t('premium.label', 'Premium')}</span>}
    </span>
  );
}
