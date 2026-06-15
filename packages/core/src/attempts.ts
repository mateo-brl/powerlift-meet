import type { Attempt, AttemptStatus } from './types.js';

/** Couleur fédérale équivalente au statut : vert / mauve / blanc. */
type FedColor = 'green' | 'purple' | 'white';

function color(a: Attempt): FedColor {
  if (a.status === 'good') return 'green';
  if (a.status === 'fail') return 'purple';
  return 'white'; // pending ou empty (cellule sans couleur de jugement)
}

function w(a: Attempt): number {
  return a.weight ?? 0;
}

/** Meilleur essai réussi d'un mouvement (porte `calcul_total_SQUAT/DC/SDT`). */
export function bestGood(attempts: Attempt[]): number {
  let best = 0;
  for (const a of attempts) {
    if (a.status === 'good') best = Math.max(best, w(a));
  }
  return best;
}

/** Vrai si les 3 essais du mouvement sont manqués (mouvement nul). */
export function allFailed(attempts: Attempt[]): boolean {
  return attempts.length === 3 && attempts.every((a) => a.status === 'fail');
}

/**
 * Charge « annoncée » d'un mouvement : porte fidèlement `calcul_annonce_SQUAT/DC/SDT`
 * (cascade de `Select Case` sur les couleurs des 3 essais). Sert au total annoncé,
 * c.-à-d. la projection de total pendant la compétition.
 */
export function announceLift(a0: Attempt, a1: Attempt, a2: Attempt): number {
  const c = color(a0);
  const c1 = color(a1);
  const c2 = color(a2);
  const v0 = w(a0);
  const v1 = w(a1);
  const v2 = w(a2);

  if (c === 'green') {
    if (c1 === 'green') {
      if (c2 === 'green') return v2;
      if (c2 === 'white') return v2 !== 0 ? v2 : v1;
      return v1; // c2 purple
    }
    if (c1 === 'purple') {
      if (c2 === 'green') return v2;
      if (c2 === 'white') return v2 !== 0 ? v2 : v0;
      return v0; // c2 purple
    }
    // c1 white
    return v1 !== 0 ? v1 : v0;
  }

  if (c === 'purple') {
    if (c1 === 'purple') {
      if (c2 === 'purple') return 0;
      return v2; // c2 white ou green
    }
    if (c1 === 'green') {
      if (c2 === 'purple') return v1;
      if (c2 === 'white') return v2 !== 0 ? v2 : v1;
      return v2; // c2 green
    }
    return v1; // c1 white
  }

  // c white
  return v0;
}

/** Construit un essai « vide ». */
export function emptyAttempt(): Attempt {
  return { weight: null, status: 'empty' };
}

/** Statut lisible (debug/affichage). */
export const STATUS_LABEL: Record<AttemptStatus, string> = {
  good: 'Réussi',
  fail: 'Manqué',
  pending: 'Annoncé',
  empty: '—',
};
