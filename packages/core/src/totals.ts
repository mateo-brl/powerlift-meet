import type { Athlete, LiftKey } from './types.js';
import { LIFT_ORDER } from './types.js';
import { allFailed, announceLift, bestGood } from './attempts.js';

/** Meilleur essai réussi par mouvement (0 si aucun). */
export function bestByLift(a: Athlete): Record<LiftKey, number> {
  return {
    squat: bestGood(a.lifts.squat),
    bench: bestGood(a.lifts.bench),
    deadlift: bestGood(a.lifts.deadlift),
  };
}

/**
 * Total réalisé (porte `total_réussi`) : somme des meilleurs essais réussis, **sauf** si
 * un mouvement est entièrement manqué (3 essais ratés) auquel cas le total est nul
 * (règle fédérale du mouvement nul).
 */
export function totalRealise(a: Athlete): number {
  const best = bestByLift(a);
  for (const key of LIFT_ORDER) {
    if (best[key] === 0 && allFailed(a.lifts[key])) return 0;
  }
  return round1(best.squat + best.bench + best.deadlift);
}

/**
 * Total annoncé (porte `total_annonce`) : somme des charges annoncées par mouvement ;
 * si l'une vaut 0, on somme les deux autres (projection en cours de compétition).
 */
export function totalAnnonce(a: Athlete): number {
  const sq = announceLift(a.lifts.squat[0]!, a.lifts.squat[1]!, a.lifts.squat[2]!);
  const dc = announceLift(a.lifts.bench[0]!, a.lifts.bench[1]!, a.lifts.bench[2]!);
  const sdt = announceLift(a.lifts.deadlift[0]!, a.lifts.deadlift[1]!, a.lifts.deadlift[2]!);
  let total: number;
  if (sq === 0) total = dc + sdt;
  else if (dc === 0) total = sq + sdt;
  else if (sdt === 0) total = sq + dc;
  else total = sq + dc + sdt;
  return round1(total);
}

/** Arrondi à 0,1 kg (les charges fédérales sont au demi-kilo). */
export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
