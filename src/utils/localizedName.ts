interface LocalizedNames {
  name?: string;
  nameEn?: string;
  nameJa?: string | null;
}

export function getLocalizedMoveName(move: LocalizedNames, locale: string): string {
  if (locale.startsWith('ja')) return move.nameJa || move.nameEn || move.name || '';
  return move.nameEn || move.name || '';
}
