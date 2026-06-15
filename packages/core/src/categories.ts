import type { Discipline, Sex } from './types.js';

/**
 * Sélectionne la catégorie de poids : première tranche `cut` telle que `bw <= cut`,
 * sinon la catégorie supérieure `+<dernier> Kg`. Reproduit les cascades fédérales.
 */
function pick(bw: number, cuts: readonly number[]): string {
  for (const cut of cuts) {
    if (bw <= cut) return `${cut} Kg`;
  }
  return `+${cuts[cuts.length - 1]} Kg`;
}

// Tranches portées de `categorie_poids_homme` / `categorie_poids_femme` (VBA fédéral).
const HOMME = {
  cadetFA: [53, 59, 66, 74, 83],
  juniorFA: [53, 59, 66, 74, 83, 93, 105, 120],
  seniorFA: [59, 66, 74, 83, 93, 105, 120],
  pl: [59, 66, 74, 83, 93, 105, 120],
} as const;

const FEMME = {
  cadetFA: [47, 52, 57, 63],
  juniorFA: [43, 47, 52, 57, 63, 69, 76, 84],
  seniorFA: [47, 52, 57, 63, 69, 76, 84],
  pl: [47, 52, 57, 63, 69, 76, 84],
} as const;

/**
 * Catégorie de poids d'un athlète (porte `categorie_poids_homme` / `categorie_poids_femme`).
 *
 * @returns p.ex. `"83 Kg"`, `"+120 Kg"`, `"0"` si interdit, `""` si données insuffisantes.
 */
export function weightCategory(
  sex: Sex,
  discipline: Discipline,
  ageCat: string,
  bodyweight: number | null,
): string {
  if (bodyweight == null) return '';
  if (ageCat === 'INTERDIT') return '0';

  const t = sex === 'M' ? HOMME : FEMME;
  if (discipline === 'PL') return pick(bodyweight, t.pl);
  if (discipline === 'FA') {
    if (ageCat === 'CADET') return pick(bodyweight, t.cadetFA);
    if (ageCat === 'SJR' || ageCat === 'JR') return pick(bodyweight, t.juniorFA);
    return pick(bodyweight, t.seniorFA);
  }
  return '';
}
