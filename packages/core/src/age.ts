import type { Discipline } from './types.js';
import catAgeTable from './reference/cat-age.json' with { type: 'json' };

type YearMap = Record<string, string>;
interface CatAgeTable {
  fa: YearMap;
  pl: YearMap;
  faA1: YearMap;
  plA1: YearMap;
}

const TABLE = catAgeTable as CatAgeTable;

/**
 * Catégorie d'âge d'un athlète, lue dans la table fédérale `Cat. d'âge`
 * (porte `calcul_age` / `calcul_age_A1`).
 *
 * @param discipline FA ou PL (tables distinctes).
 * @param birthYear  année de naissance.
 * @param plusOne    `true` pour la table « A+1 » (année d'application suivante).
 * @returns la catégorie (`INTERDIT`, `SJR`, `JR`, `SNR`, `M1`…`M4`) ou `''` si introuvable.
 */
export function ageCategory(
  discipline: Discipline,
  birthYear: number | null,
  plusOne = false,
): string {
  if (!birthYear) return '';
  const key = (
    plusOne ? `${discipline.toLowerCase()}A1` : discipline.toLowerCase()
  ) as keyof CatAgeTable;
  const map = TABLE[key];
  return map?.[String(birthYear)] ?? '';
}

/** Table brute (utile à l'app pour lister/valider les correspondances). */
export const catAgeData = TABLE;
