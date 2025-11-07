/**
 * Pokemon type constants
 * Used for filtering, display, and type effectiveness calculations
 */
export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokemonType = typeof POKEMON_TYPES[number];

/**
 * Move category constants
 */
export const MOVE_CATEGORIES = ['physical', 'special', 'status'] as const;

export type MoveCategory = typeof MOVE_CATEGORIES[number];

/**
 * Item category constants
 * Organized by competitive usage and game mechanics
 */
export const ITEM_CATEGORIES = [
  'held-items',
  'choice',
  'mega-stones',
  'z-crystals',
  'type-enhancement',
  'type-protection',
  'in-a-pinch',
  'effort-drop',
  'healing',
  'revival',
  'status-cures',
  'pp-recovery',
  'vitamins',
  'stat-boosts',
  'standard-balls',
  'special-balls',
  'species-specific',
  'plates',
  'memories',
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

/**
 * Sort options for Pokemon lists
 */
export const POKEMON_SORT_OPTIONS = [
  'name',
  'national_number',
  'stat_total',
  'hp_max',
  'attack_max',
  'defense_max',
  'sp_atk_max',
  'sp_def_max',
  'speed_max',
] as const;

export type PokemonSortOption = typeof POKEMON_SORT_OPTIONS[number];

/**
 * Sort order options
 */
export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortOrder = typeof SORT_ORDERS[number];
