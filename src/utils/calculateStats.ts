/**
 * Pokemon stat calculation utilities
 * Based on official Pokemon stat formulas
 */

import { StatSpread } from '@brianchan661/pokemon-champion-shared';

/**
 * Calculate HP stat
 * Formula: floor(((2 * Base + IV + floor(EV / 4)) * Level) / 100) + Level + 10
 */
export function calculateHP(
  base: number,
  iv: number,
  ev: number,
  level: number
): number {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

/**
 * Calculate other stats (Attack, Defense, Sp. Atk, Sp. Def, Speed)
 * Formula: floor((floor(((2 * Base + IV + floor(EV / 4)) * Level) / 100) + 5) * Nature)
 */
export function calculateStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureModifier: number = 1.0
): number {
  const baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(baseStat * natureModifier);
}

/**
 * Calculate all stats for a Pokemon
 */
export function calculateAllStats(
  baseStats: StatSpread,
  ivs: StatSpread,
  evs: StatSpread,
  level: number,
  natureModifiers: {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  }
): StatSpread {
  return {
    hp: calculateHP(baseStats.hp, ivs.hp, evs.hp, level),
    attack: calculateStat(baseStats.attack, ivs.attack, evs.attack, level, natureModifiers.attack),
    defense: calculateStat(baseStats.defense, ivs.defense, evs.defense, level, natureModifiers.defense),
    specialAttack: calculateStat(baseStats.specialAttack, ivs.specialAttack, evs.specialAttack, level, natureModifiers.specialAttack),
    specialDefense: calculateStat(baseStats.specialDefense, ivs.specialDefense, evs.specialDefense, level, natureModifiers.specialDefense),
    speed: calculateStat(baseStats.speed, ivs.speed, evs.speed, level, natureModifiers.speed),
  };
}

/**
 * Validate EV spread
 * Rules: Each stat 0-252, total max 510
 */
export function validateEVs(evs: StatSpread): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check individual stat limits
  Object.entries(evs).forEach(([stat, value]) => {
    if (value < 0 || value > 252) {
      errors.push(`${stat}: Must be between 0 and 252 (current: ${value})`);
    }
  });

  // Check total limit
  const total = Object.values(evs).reduce((sum, val) => sum + val, 0);
  if (total > 510) {
    errors.push(`Total EVs: ${total}/510 (exceeds maximum)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate IV spread
 * Rule: Each stat 0-31
 */
export function validateIVs(ivs: StatSpread): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(ivs).forEach(([stat, value]) => {
    if (value < 0 || value > 31) {
      errors.push(`${stat}: Must be between 0 and 31 (current: ${value})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default IV spread (all 31s - perfect)
 */
export function getDefaultIVs(): StatSpread {
  return {
    hp: 31,
    attack: 31,
    defense: 31,
    specialAttack: 31,
    specialDefense: 31,
    speed: 31,
  };
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
