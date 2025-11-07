import { useEffect, useRef, useState, useMemo } from 'react';
import { MentionOption, MentionType } from '@/hooks/useMentions';

interface MentionAutocompleteProps {
  options: MentionOption[];
  selectedIndex: number;
  onSelect: (option: MentionOption) => void;
  position: { top: number; left: number };
  loading?: boolean;
}

const TYPE_COLORS = {
  pokemon: 'bg-blue-100 text-blue-700 border-blue-200',
  move: 'bg-orange-100 text-orange-700 border-orange-200',
  item: 'bg-purple-100 text-purple-700 border-purple-200',
  ability: 'bg-green-100 text-green-700 border-green-200',
};

const TYPE_LABELS = {
  pokemon: 'Pokemon',
  move: 'Move',
  item: 'Item',
  ability: 'Ability',
};

type TabType = 'all' | MentionType;

export function MentionAutocomplete({
  options,
  selectedIndex,
  onSelect,
  position,
  loading,
}: MentionAutocompleteProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [filterText, setFilterText] = useState('');

  // Filter options by tab and filter text
  const filteredOptions = useMemo(() => {
    let result = activeTab === 'all' ? options : options.filter(opt => opt.type === activeTab);

    // Apply text filter
    if (filterText.trim()) {
      const query = filterText.toLowerCase().trim();

      result = result.filter(opt => {
        // For Pokemon, also check national number
        if (opt.type === 'pokemon' && opt.nationalNumber) {
          // Check if query is a number (national dex number)
          const isNumber = /^\d+$/.test(query);
          if (isNumber) {
            // Filter by national dex number - remove leading zeros
            const nationalNum = parseInt(opt.nationalNumber, 10).toString();
            return nationalNum.includes(query);
          }
        }

        // Default: filter by name
        return opt.name.toLowerCase().includes(query);
      });
    }

    return result;
  }, [options, activeTab, filterText]);

  // Count by type for tab badges
  const counts = useMemo(() => {
    const result: Record<MentionType, number> = {
      pokemon: 0,
      move: 0,
      item: 0,
      ability: 0,
    };
    options.forEach(opt => {
      result[opt.type]++;
    });
    return result;
  }, [options]);

  // Reset filter when tab changes
  useEffect(() => {
    setFilterText('');
  }, [activeTab]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  if (loading) {
    return (
      <div
        className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div
        className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-sm text-gray-500">No results found</p>
      </div>
    );
  }

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-[550px] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Tabs */}
      <div className="grid grid-cols-5 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-2 py-2 text-xs font-medium ${
            activeTab === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({options.length})
        </button>
        <button
          onClick={() => setActiveTab('pokemon')}
          className={`px-2 py-2 text-xs font-medium ${
            activeTab === 'pokemon'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pokemon ({counts.pokemon})
        </button>
        <button
          onClick={() => setActiveTab('move')}
          className={`px-2 py-2 text-xs font-medium ${
            activeTab === 'move'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Moves ({counts.move})
        </button>
        <button
          onClick={() => setActiveTab('item')}
          className={`px-2 py-2 text-xs font-medium ${
            activeTab === 'item'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Items ({counts.item})
        </button>
        <button
          onClick={() => setActiveTab('ability')}
          className={`px-2 py-2 text-xs font-medium ${
            activeTab === 'ability'
              ? 'text-green-600 border-b-2 border-green-600 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Abilities ({counts.ability})
        </button>
      </div>

      {/* Filter Input */}
      <div className="p-2 bg-white border-b border-gray-200">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder={
            activeTab === 'pokemon'
              ? 'Filter by name or number...'
              : `Filter ${activeTab === 'all' ? 'all' : TYPE_LABELS[activeTab as MentionType]}...`
          }
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Options List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No {activeTab === 'all' ? 'results' : TYPE_LABELS[activeTab as MentionType]} found
          </div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={`${option.type}-${option.id}`}
              ref={index === selectedIndex ? selectedRef : null}
              onClick={() => onSelect(option)}
              className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-primary-50' : ''
              }`}
            >
              {/* Icon/Sprite */}
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                {option.sprite ? (
                  <img
                    src={option.sprite}
                    alt={option.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${TYPE_COLORS[option.type]} flex items-center justify-center text-xs font-bold`}>
                    {option.type[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name and Info */}
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">{option.name}</div>
                {option.meta && (
                  <div className="text-xs text-gray-500">{option.meta}</div>
                )}
              </div>

              {/* Type Badge */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded border ${TYPE_COLORS[option.type]}`}
              >
                {TYPE_LABELS[option.type]}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
