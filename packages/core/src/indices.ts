import type { Discipline, Sex } from './types.js';

/**
 * Constantes de la formule d'indice IPF GL (« Goodlift »), portées du VBA fédéral
 * (`indice_homme_FA`, `indice_femme_FA`, `indice_homme_PL`, `indice_femme_PL`).
 * Clé : `${discipline}-${sex}`.
 */
export const GL_CONST: Record<string, readonly [number, number, number]> = {
  'FA-M': [1199.72839, 1025.18162, 0.00921],
  'FA-F': [610.32796, 1045.59282, 0.03048],
  'PL-M': [1236.25115, 1449.21864, 0.01644],
  'PL-F': [758.63878, 949.31382, 0.02435],
};

/**
 * Indice IPF d'un athlète : `100 / (C1 − C2·e^(−C3·PdC))`.
 * Retourne 0 si le poids de corps est absent ou nul (comme la fédé).
 */
export function indice(discipline: Discipline, sex: Sex, bodyweight: number | null): number {
  if (!bodyweight || bodyweight <= 0) return 0;
  const c = GL_CONST[`${discipline}-${sex}`];
  if (!c) return 0;
  const [c1, c2, c3] = c;
  const denom = c1 - c2 * Math.exp(-c3 * bodyweight);
  return denom !== 0 ? 100 / denom : 0;
}

/**
 * Indice arrondi comme dans la feuille fédérale : `ROUNDUP(..., 6)` (arrondi au
 * supérieur à 6 décimales). Sert aux comparaisons « au point près » avec Excel.
 */
export function indiceRounded(discipline: Discipline, sex: Sex, bodyweight: number | null): number {
  return roundUp(indice(discipline, sex, bodyweight), 6);
}

/**
 * Équivalent de `ROUNDUP(value, digits)` d'Excel (arrondi à l'opposé de zéro).
 * Un epsilon relatif absorbe les erreurs flottantes pour ne pas « monter » à tort
 * une valeur qui devrait tomber juste.
 */
export function roundUp(value: number, digits: number): number {
  const f = 10 ** digits;
  const scaled = value * f;
  const eps = Math.abs(scaled) * 1e-9;
  return value >= 0 ? Math.ceil(scaled - eps) / f : Math.floor(scaled + eps) / f;
}
