/**
 * Pokemon Champion stat calculation utilities
 * IVs fixed at 31, SPs 0-32 per stat, 66 total.
 * Matches the formula used in pokemon/[id].tsx calcStat().
 */

import { StatSpread } from '@brianchan661/pokemon-champion-shared';

const FIXED_LEVEL = 50;

// Pokemon Champions EV limits: 0-32 per stat, 66 total
export const EV_MAX_PER_STAT = 32;
export const EV_MAX_TOTAL = 66;

/**
 * Calculate a single stat (Attack, Defense, SpAtk, SpDef, Speed)
 * Formula: floor((floor((2 * base + 31) * 50 / 100) + 5 + ev) * natureMod)
 */
export function calculateStat(
  base: number,
  ev: number,
  natureModifier: number = 1.0
): number {
  const inner = Math.floor((2 * base + 31) * FIXED_LEVEL / 100);
  return Math.floor((inner + 5 + ev) * natureModifier);
}

/**
 * Calculate HP stat
 * Formula: floor((2 * base + 31) * 50 / 100) + 50 + 10 + ev
 */
export function calculateHP(base: number, ev: number): number {
  const inner = Math.floor((2 * base + 31) * FIXED_LEVEL / 100);
  return inner + FIXED_LEVEL + 10 + ev;
}

/**
 * Calculate all stats for a Pokemon
 */
export function calculateAllStats(
  baseStats: StatSpread,
  evs: StatSpread,
  natureModifiers: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  }
): StatSpread {
  return {
    hp: calculateHP(baseStats.hp, evs.hp),
    attack: calculateStat(baseStats.attack, evs.attack, natureModifiers.attack),
    defense: calculateStat(baseStats.defense, evs.defense, natureModifiers.defense),
    specialAttack: calculateStat(baseStats.specialAttack, evs.specialAttack, natureModifiers.specialAttack),
    specialDefense: calculateStat(baseStats.specialDefense, evs.specialDefense, natureModifiers.specialDefense),
    speed: calculateStat(baseStats.speed, evs.speed, natureModifiers.speed),
  };
}

/**
 * Validate EV spread
 * Rules: Each stat 0-32, total max 66
 */
export function validateEVs(evs: StatSpread): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(evs).forEach(([stat, value]) => {
    if (value < 0 || value > EV_MAX_PER_STAT) {
      errors.push(`${stat}: Must be between 0 and ${EV_MAX_PER_STAT} (current: ${value})`);
    }
  });

  const total = Object.values(evs).reduce((sum, val) => sum + val, 0);
  if (total > EV_MAX_TOTAL) {
    errors.push(`Total EVs: ${total}/${EV_MAX_TOTAL} (exceeds maximum)`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get default EV spread (all 0s)
 */
export function getDefaultEVs(): StatSpread {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
}
