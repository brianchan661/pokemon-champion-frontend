import Link from 'next/link';
import { TypeIcon } from './TypeIcon';

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
  if (variant === 'detailed') {
    return (
      <div className={className}>
        {/* Ability - Top Right */}
        {(pokemon?.abilityData?.name || pokemon?.abilityIdentifier) && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium">
              {pokemon.abilityData?.name || pokemon.abilityIdentifier}
            </span>
          </div>
        )}

        {/* Pokemon Header */}
        <div className="flex items-center gap-3 mb-3 pr-24">
          {pokemon?.pokemonData?.imageUrl && (
            <img
              src={pokemon.pokemonData.imageUrl}
              alt={pokemon.pokemonData.name || 'Pokemon'}
              className="w-16 h-16 object-contain"
            />
          )}
          <div className="flex-1">
            {enableLinks && (pokemon?.pokemonData?.nationalNumber || pokemon?.pokemonId) ? (
              <Link
                href={`/pokemon/${pokemon.pokemonData?.nationalNumber || pokemon.pokemonId}`}
                className="font-bold text-lg text-gray-900 dark:text-dark-text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {pokemon?.pokemonData?.name || 'Unknown'}
              </Link>
            ) : (
              <h3 className="font-bold text-lg text-gray-900 dark:text-dark-text-primary">
                {pokemon?.pokemonData?.name || 'Unknown'}
              </h3>
            )}
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Lv. {pokemon?.level || 50} • {pokemon?.natureData?.name || pokemon?.natureId || 'Unknown'}
            </p>
            {pokemon?.pokemonData?.types && pokemon.pokemonData.types.length > 0 && (
              <div className="flex gap-1 mt-1">
                {pokemon.pokemonData.types.map((type) => (
                  <TypeIcon key={type} type={type} size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Item */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-dark-text-secondary mb-1">Item:</p>
          {pokemon?.itemData ? (
            enableLinks && pokemon.itemData.identifier ? (
              <Link
                href={`/data/items/${pokemon.itemData.identifier}`}
                className="flex items-center gap-2 hover:text-primary-600 transition-colors w-fit"
              >
                {pokemon.itemData.spriteUrl && (
                  <img
                    src={pokemon.itemData.spriteUrl}
                    alt={pokemon.itemData.name || 'Item'}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <span className="text-xs text-gray-700 dark:text-dark-text-secondary">{pokemon.itemData.name}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                {pokemon.itemData.spriteUrl && (
                  <img
                    src={pokemon.itemData.spriteUrl}
                    alt={pokemon.itemData.name || 'Item'}
                    className="w-6 h-6 object-contain"
                  />
                )}
                <span className="text-xs text-gray-700 dark:text-dark-text-secondary">{pokemon.itemData.name}</span>
              </div>
            )
          ) : (
            <span className="text-xs text-gray-400">None</span>
          )}
        </div>

        {/* Moves */}
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-dark-text-secondary mb-1">Moves:</p>
          <div className="space-y-1">
            {pokemon?.movesData?.map((move, index) => {
              const MoveContent = () => (
                <>
                  {move.type && <TypeIcon type={move.type} size="xs" />}
                  <span className="font-medium flex-1 dark:text-dark-text-primary">{move.name || '-'}</span>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-dark-text-tertiary">
                    <span className="min-w-[2rem] text-right">{move.power || '-'}</span>
                    <span className="text-gray-400 dark:text-gray-500">/</span>
                    <span className="min-w-[2rem] text-right">{move.accuracy ? `${move.accuracy}%` : '-'}</span>
                    <span className="text-gray-400 dark:text-gray-500">/</span>
                    <span className="min-w-[1.5rem] text-right">{move.pp ? `${move.pp}PP` : '-'}</span>
                  </div>
                </>
              );

              return enableLinks && move.identifier ? (
                <Link
                  key={index}
                  href={`/data/moves/${move.identifier}`}
                  className="flex items-center gap-2 text-xs bg-white dark:bg-dark-bg-primary px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                >
                  <MoveContent />
                </Link>
              ) : (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs bg-white dark:bg-dark-bg-primary px-2 py-1 rounded"
                >
                  <MoveContent />
                </div>
              );
            })}
            {/* Show empty slots */}
            {pokemon?.movesData && pokemon.movesData.length < 4 && Array.from({ length: 4 - pokemon.movesData.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center gap-2 text-xs bg-white dark:bg-dark-bg-primary px-2 py-1 rounded">
                <span className="text-gray-400 dark:text-gray-600 flex-1">-</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tera Type */}
        {pokemon?.teraType && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
            <span className="text-xs font-semibold text-gray-700 dark:text-dark-text-secondary">Tera Type:</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
              {pokemon.teraType}
            </span>
          </div>
        )}

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
