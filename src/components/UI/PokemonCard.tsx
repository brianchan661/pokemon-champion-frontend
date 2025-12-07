import Link from 'next/link';
import { TypeIcon } from './TypeIcon';
import { TeraTypeIcon } from './TeraTypeIcon';
import { MoveCategoryIcon, MoveCategory } from './MoveCategoryIcon';

interface PokemonCardProps {
  pokemon?: {
    level?: number;
    pokemonId?: number;
    pokemonData?: {
      name?: string;
      imageUrl?: string;
      types?: string[];
      nationalNumber?: number;
    };
    itemData?: {
      spriteUrl?: string;
      name?: string;
      identifier?: string;
    };
    movesData?: Array<{
      name?: string;
      type?: string;
      identifier?: string;
      power?: number | null;
      accuracy?: number | null;
      pp?: number | null;
      category?: string;
    }>;
    abilityData?: {
      name?: string;
    };
    abilityIdentifier?: string;
    natureData?: {
      name?: string;
    };
    natureId?: number;
    teraType?: string;
  };
  onRemove?: (e: React.MouseEvent) => void;
  showRemoveButton?: boolean;
  showSlotNumber?: boolean;
  slotNumber?: number;
  variant?: 'compact' | 'detailed';
  enableLinks?: boolean;
  className?: string;
}

/**
 * Reusable Pokemon card display component
 * Shows Pokemon sprite, name, types, item, and moves
 * Supports compact (simple) and detailed (with stats) variants
 */
export function PokemonCard({
  pokemon,
  onRemove,
  showRemoveButton = false,
  showSlotNumber = false,
  slotNumber,
  variant = 'compact',
  enableLinks = false,
  className = '',
}: PokemonCardProps) {

  // Map types to hex colors for gradients
  const getTypeHex = (t: string) => {
    const colors: Record<string, string> = {
      water: '#3b82f6', fire: '#ef4444', grass: '#22c55e', electric: '#eab308',
      flying: '#818cf8', bug: '#84cc16', ground: '#d97706', rock: '#78716c',
      steel: '#94a3b8', ice: '#67e8f9', ghost: '#9333ea', dark: '#404040',
      psychic: '#ec4899', fairy: '#fda4af', dragon: '#7c3aed', poison: '#c026d3',
      fighting: '#ea580c', normal: '#a8a29e'
    };
    return colors[t.toLowerCase()] || '#6b7280';
  };

  const getHeaderStyle = () => {
    const types = pokemon?.pokemonData?.types || [];
    if (types.length === 2) {
      const color1 = getTypeHex(types[0]);
      const color2 = getTypeHex(types[1]);
      // Split color: 50% color1, 50% color2 with a hard stop
      return { background: `linear-gradient(to right, ${color1} 50%, ${color2} 50%)` };
    }
    return { backgroundColor: getTypeHex(types[0] || 'normal') };
  };

  if (variant === 'detailed') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300 flex flex-col h-full group relative ${className}`}>
        {/* Header Bar */}
        <div className="h-2 w-full" style={getHeaderStyle()} />

        <div className="p-4 flex-1 flex flex-col">
          {/* Top Row: Name, Tera, and Sprite */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                {enableLinks && (pokemon?.pokemonData?.nationalNumber || pokemon?.pokemonId) ? (
                  <Link
                    href={`/pokemon/${pokemon.pokemonData?.nationalNumber || pokemon.pokemonId}`}
                    className="font-bold text-lg text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate relative z-10"
                  >
                    {pokemon?.pokemonData?.name || 'Unknown'}
                  </Link>
                ) : (
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
                    {pokemon?.pokemonData?.name || 'Unknown'}
                  </h3>
                )}
                {/* Types */}
                <div className="flex gap-0.5 shrink-0">
                  {pokemon?.pokemonData?.types?.map((t: string) => (
                    <TypeIcon key={t} type={t} size="xs" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                  Lv. {pokemon?.level || 50}
                </span>
                <span>{pokemon?.natureData?.name || pokemon?.natureId || 'Unknown'}</span>
              </div>
            </div>

            {/* Tera Badge */}
            {pokemon?.teraType && (
              <div className="flex flex-col items-center mr-3 shrink-0">
                <TeraTypeIcon type={pokemon.teraType} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">Tera</span>
              </div>
            )}

            <div className="relative -mt-2 shrink-0">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                {pokemon?.pokemonData?.imageUrl ? (
                  <img src={pokemon.pokemonData.imageUrl} alt={pokemon.pokemonData.name} className="w-16 h-16 object-contain z-10" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Item and Ability */}
          <div className="grid grid-cols-[1.4fr_0.6fr] gap-3 mb-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
            <div className="flex flex-col min-w-0 justify-center">
              {enableLinks && pokemon?.itemData?.identifier ? (
                <Link
                  href={`/data/items/${pokemon.itemData.identifier}`}
                  className="flex items-center gap-2 group/item transition-colors"
                >
                  {pokemon?.itemData?.spriteUrl && (
                    <img
                      src={pokemon.itemData.spriteUrl}
                      alt={pokemon.itemData.name}
                      className="w-6 h-6 object-contain shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span
                    className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 group-hover/item:underline"
                    title={pokemon?.itemData?.name}
                  >
                    {pokemon?.itemData?.name || 'Item'}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  {pokemon?.itemData?.spriteUrl && (
                    <img
                      src={pokemon.itemData.spriteUrl}
                      alt={pokemon.itemData.name}
                      className="w-6 h-6 object-contain shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate" title={pokemon?.itemData?.name}>
                    {pokemon?.itemData?.name || 'No Item'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              {enableLinks && pokemon?.abilityIdentifier ? (
                <Link
                  href={`/data/abilities/${pokemon.abilityIdentifier}`}
                  className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                  title={pokemon?.abilityData?.name}
                >
                  {pokemon?.abilityData?.name || pokemon?.abilityIdentifier || 'Ability'}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate" title={pokemon?.abilityData?.name}>
                  {pokemon?.abilityData?.name || pokemon?.abilityIdentifier || 'No Ability'}
                </span>
              )}
            </div>
          </div>

          {/* Moves */}
          <div className="mt-auto space-y-2">
            {pokemon?.movesData?.map((move, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                {move.type && <TypeIcon type={move.type} size="xs" />}
                {move.category && <MoveCategoryIcon category={move.category as MoveCategory} size={16} />}
                {enableLinks && move.identifier ? (
                  <Link
                    href={`/data/moves/${move.identifier}`}
                    className="font-medium text-gray-700 dark:text-gray-300 flex-1 hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                  >
                    {move.name}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-700 dark:text-gray-300 flex-1">{move.name}</span>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  {move.power ? <span className="min-w-[1.5rem] text-right">{move.power}</span> : <span className="min-w-[1.5rem] text-right">-</span>}
                  <span>/</span>
                  {move.accuracy ? <span className="min-w-[1.5rem] text-right">{move.accuracy}%</span> : <span className="min-w-[1.5rem] text-right">-</span>}
                  <span>/</span>
                  <span className="min-w-[1.5rem] text-right">{move.pp}PP</span>
                </div>
              </div>
            ))}
            {/* Empty slots */}
            {pokemon?.movesData && pokemon.movesData.length < 4 && Array.from({ length: 4 - pokemon.movesData.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-md border border-transparent">
                <span className="text-gray-400 dark:text-gray-600 flex-1">-</span>
              </div>
            ))}
          </div>
        </div>

        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-20 shadow-sm"
            title="Remove"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Slot Number */}
        {showSlotNumber && slotNumber !== undefined && (
          <div className="absolute bottom-2 left-2 w-5 h-5 bg-gray-700 text-white text-xs rounded-full flex items-center justify-center font-medium z-20 opacity-75">
            {slotNumber}
          </div>
        )}
      </div>
    );
  }

  // Compact variant (original)
  return (
    <div className={className}>
      {/* Pokemon Header with Sprite */}
      <div className="flex gap-2 mb-2">
        {pokemon?.pokemonData?.imageUrl ? (
          <img
            src={pokemon.pokemonData.imageUrl}
            alt={pokemon.pokemonData.name || 'Pokemon'}
            className="w-12 h-12 object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">?</span>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-bold text-sm text-gray-900 dark:text-dark-text-primary truncate text-left">
            {pokemon?.pokemonData?.name || 'Unknown'}
          </h3>
          {pokemon?.pokemonData?.types && pokemon.pokemonData.types.length > 0 && (
            <div className="flex gap-1 mt-1">
              {pokemon.pokemonData.types.map((type) => (
                <TypeIcon key={type} type={type} size="xs" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item Sprite */}
      <div className="flex items-center justify-center mb-2 py-1 bg-white dark:bg-dark-bg-primary rounded h-8">
        {pokemon?.itemData?.spriteUrl && (
          <img
            src={pokemon.itemData.spriteUrl}
            alt={pokemon.itemData.name || 'Item'}
            title={pokemon.itemData.name}
            className="w-6 h-6 object-contain"
          />
        )}
      </div>

      {/* Moves */}
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, index) => {
          const move = pokemon?.movesData?.[index];
          return (
            <div
              key={index}
              className="flex items-center gap-1.5 text-xs bg-white dark:bg-dark-bg-primary px-2 py-1 rounded"
            >
              {move && move.type && move.name ? (
                <>
                  <TypeIcon type={move.type} size="xs" />
                  {move.category && <MoveCategoryIcon category={move.category as MoveCategory} size={16} />}
                  <span className="font-medium truncate flex-1 text-gray-800 dark:text-dark-text-primary">
                    {move.name}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 dark:text-gray-600 flex-1">-</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Remove Button */}
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Slot Number */}
      {showSlotNumber && slotNumber !== undefined && (
        <div className="absolute bottom-1 left-1 w-5 h-5 bg-gray-700 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {slotNumber}
        </div>
      )}
    </div>
  );
}

