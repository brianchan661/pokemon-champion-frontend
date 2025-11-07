import { useState } from 'react';
import { useRouter } from 'next/router';
import { MentionToken } from './MentionTextarea';

interface MentionChipProps {
  mention: MentionToken;
  className?: string;
}

const TYPE_STYLES = {
  pokemon: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-100',
  },
  move: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-100',
  },
  item: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-100',
  },
  ability: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    hover: 'hover:bg-green-100',
  },
};

export function MentionChip({ mention, className = '' }: MentionChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();
  const style = TYPE_STYLES[mention.type];

  // Generate URL based on mention type
  const getUrl = (): string => {
    switch (mention.type) {
      case 'pokemon':
        return `/pokemon/${mention.nationalNumber || mention.id}`;
      case 'move':
        return `/data/moves/${mention.id}`;
      case 'item':
        return `/data/items/${mention.id}`;
      case 'ability':
        return `/data/abilities/${mention.id}`;
      default:
        return '#';
    }
  };

  return (
    <a
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${style.hover} transition-colors cursor-pointer ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ verticalAlign: 'baseline' }}
    >
      {mention.sprite && (
        <img
          src={mention.sprite}
          alt={mention.name}
          className="w-4 h-4 object-contain flex-shrink-0"
        />
      )}
      <span className="text-sm font-medium leading-none">{mention.name}</span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute mt-8 bg-gray-900 text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
          {mention.type.charAt(0).toUpperCase() + mention.type.slice(1)}: {mention.name} (Click to view)
        </div>
      )}
    </a>
  );
}
