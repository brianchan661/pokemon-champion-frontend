import { Coffee } from 'lucide-react';
import { useTranslation } from 'next-i18next';

interface BuyMeCoffeeButtonProps {
  compact?: boolean;
}

export const BuyMeCoffeeButton = ({ compact = false }: BuyMeCoffeeButtonProps) => {
  const { t } = useTranslation('common');

  const handleClick = () => {
    const url = process.env.NEXT_PUBLIC_BMC_PAGE_URL || 'https://buymeacoffee.com/pokemon.champion.coffee';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    // Compact version - just icon with tooltip
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center p-2 text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        aria-label={t('support.buyMeACoffee', 'Support us on Buy Me a Coffee')}
        title={t('support.coffee', 'Buy me a coffee')}
      >
        <Coffee size={18} />
      </button>
    );
  }

  return (
    <>
      {/* Desktop Button */}
      <button
        onClick={handleClick}
        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
        aria-label={t('support.buyMeACoffee', 'Support us on Buy Me a Coffee')}
      >
        <Coffee size={16} />
        <span>{t('support.coffee', 'Buy me a coffee')}</span>
      </button>

      {/* Mobile Button */}
      <button
        onClick={handleClick}
        className="md:hidden w-full text-left inline-flex items-center gap-2 px-3 py-2 text-base font-medium text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 rounded-lg transition-colors duration-200"
        aria-label={t('support.buyMeACoffee', 'Support us on Buy Me a Coffee')}
      >
        <Coffee size={18} />
        <span>{t('support.coffee', 'Buy me a coffee')}</span>
      </button>
    </>
  );
};
