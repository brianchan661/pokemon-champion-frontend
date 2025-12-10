export const TYPES = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground',
    'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Steel', 'Dark', 'Fairy'
] as const;

export type PokeType = typeof TYPES[number];

// 0: No effect (0x)
// 1: Not very effective (0.5x)
// 2: Normal (1x)
// 3: Super effective (2x)

const TYPE_CHART = [
    // Defending ->
    // Nor Fir Wat Gra Ele Ice Fig Poi Gro Fly Psy Bug Roc Gho Dra Ste Dar Fai
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 2, 1, 2, 2], // Normal (Attacker)
    [2, 1, 1, 3, 2, 3, 2, 2, 2, 2, 2, 3, 1, 2, 1, 3, 2, 2], // Fire
    [2, 3, 1, 1, 2, 2, 2, 2, 3, 2, 2, 2, 3, 2, 1, 2, 2, 2], // Water
    [2, 1, 3, 1, 2, 2, 2, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 2], // Grass
    [2, 2, 3, 1, 1, 2, 2, 2, 0, 3, 2, 2, 2, 2, 1, 2, 2, 2], // Electric
    [2, 1, 1, 3, 2, 1, 2, 2, 3, 3, 2, 2, 2, 2, 3, 1, 2, 2], // Ice
    [3, 2, 2, 2, 2, 3, 2, 1, 2, 1, 1, 1, 3, 0, 2, 3, 3, 1], // Fighting
    [2, 2, 2, 3, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 2, 0, 2, 3], // Poison
    [2, 3, 2, 1, 3, 2, 2, 3, 2, 0, 2, 1, 3, 2, 2, 3, 2, 2], // Ground
    [2, 2, 2, 3, 1, 2, 3, 2, 2, 2, 2, 3, 1, 2, 2, 1, 2, 2], // Flying
    [2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 1, 2, 2, 2, 2, 1, 0, 2], // Psychic
    [2, 1, 2, 3, 2, 2, 1, 1, 2, 1, 3, 2, 2, 1, 2, 1, 3, 1], // Bug
    [2, 3, 2, 2, 2, 3, 1, 2, 1, 3, 2, 3, 2, 2, 2, 1, 2, 2], // Rock
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 2, 2, 1, 2], // Ghost
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1, 2, 0], // Dragon
    [2, 1, 1, 2, 1, 3, 2, 2, 2, 2, 2, 2, 3, 2, 2, 1, 2, 3], // Steel
    [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 3, 2, 2, 3, 2, 2, 1, 1], // Dark
    [2, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 2, 3, 1, 3, 2], // Fairy
];

export function getEffectiveness(attacker: PokeType, defender1: PokeType, defender2?: PokeType | null): number {
    const atkIndex = TYPES.indexOf(attacker);
    const def1Index = TYPES.indexOf(defender1);

    if (atkIndex === -1 || def1Index === -1) return 1;

    let effectiveness = getMultiplier(TYPE_CHART[atkIndex][def1Index]);

    if (defender2 && defender2 !== defender1) {
        const def2Index = TYPES.indexOf(defender2);
        if (def2Index !== -1) {
            effectiveness *= getMultiplier(TYPE_CHART[atkIndex][def2Index]);
        }
    }

    return effectiveness;
}

function getMultiplier(value: number): number {
    switch (value) {
        case 0: return 0;
        case 1: return 0.5;
        case 2: return 1;
        case 3: return 2;
        default: return 1;
    }
}
