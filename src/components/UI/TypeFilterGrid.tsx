import { TypeIcon } from './TypeIcon';

const DEFAULT_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

interface TypeFilterGridProps {
  selectedTypes: string[];
  onToggle: (type: string) => void;
  types?: string[];
}

export function TypeFilterGrid({ selectedTypes, onToggle, types = DEFAULT_TYPES }: TypeFilterGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onToggle(type)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap ${
            selectedTypes.includes(type)
              ? 'ring-2 ring-offset-1 ring-primary-500 dark:ring-offset-dark-bg-primary'
              : 'opacity-50 hover:opacity-100'
          }`}
          style={{ background: 'transparent' }}
        >
          <TypeIcon type={type} size="sm" showLabel />
        </button>
      ))}
    </div>
  );
}
