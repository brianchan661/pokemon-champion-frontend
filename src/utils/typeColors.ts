import type { CSSProperties } from 'react';

const TYPE_HEX: Record<string, string> = {
  water: '#3b82f6', fire: '#ef4444', grass: '#22c55e', electric: '#eab308',
  psychic: '#ec4899', ice: '#06b6d4', dragon: '#7c3aed', dark: '#374151',
  fairy: '#f472b6', normal: '#9ca3af', fighting: '#dc2626', flying: '#38bdf8',
  poison: '#a855f7', ground: '#d97706', rock: '#78716c', bug: '#84cc16',
  ghost: '#6d28d9', steel: '#64748b',
};

export const getTypeHex = (type: string): string =>
  TYPE_HEX[type.toLowerCase()] ?? '#9ca3af';

export const getCardHeaderStyle = (types: string[]): CSSProperties => {
  if (types.length >= 2) {
    const c1 = getTypeHex(types[0]);
    const c2 = getTypeHex(types[1]);
    return { background: `linear-gradient(to right, ${c1} 50%, ${c2} 50%)` };
  }
  return { backgroundColor: getTypeHex(types[0] ?? 'normal') };
};
