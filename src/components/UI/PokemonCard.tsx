import { TypeIcon } from './TypeIcon';

interface PokemonCardProps {
  pokemon?: {
    pokemonData?: {
      name?: string;
      imageUrl?: string;
      types?: string[];
    };
    itemData?: {
      spriteUrl?: string;
      name?: string;
    };
    movesData?: Array<{
      name?: string;
      type?: string;
    }>;
  };
  onRemove?: (e: React.MouseEvent) => void;
  showRemoveButton?: boolean;
  showSlotNumber?: boolean;
  slotNumber?: number;
  className?: string;
}

/**
 * Reusable Pokemon card display component
 * Shows Pokemon sprite, name, types, item, and moves
 */
export function PokemonCard({
  pokemon,
  onRemove,
  showRemoveButton = false,
  showSlotNumber = false,
  slotNumber,
  className = '',
}: PokemonCardProps) {
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
          <h3 className="font-bold text-sm text-gray-900 truncate text-left">
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
      <div className="flex items-center justify-center mb-2 py-1 bg-white rounded h-8">
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
              className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded"
            >
              {move && move.type && move.name ? (
                <>
                  <TypeIcon type={move.type} size="xs" />
                  <span className="font-medium truncate flex-1 text-gray-800">
                    {move.name}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 flex-1">-</span>
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
