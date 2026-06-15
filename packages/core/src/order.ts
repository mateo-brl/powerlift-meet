import type { Athlete, LiftKey } from './types.js';
import { LIFT_ORDER } from './types.js';

export interface LiveLifter {
  athlete: Athlete;
  lift: LiftKey;
  /** Numéro d'essai 1‑3. */
  attemptNo: number;
  weight: number | null;
}

export interface LiveState {
  lift: LiftKey | null;
  /** Numéro d'essai courant 1‑3 (0 si aucun). */
  attemptNo: number;
  current: LiveLifter | null;
  onDeck: LiveLifter[];
}

/**
 * Détecte le mouvement et le tour en cours, l'athlète sur la barre et la file « à suivre ».
 *
 * Logique fédérale (porte `compute_live` de l'overlay) : on parcourt les mouvements dans
 * l'ordre (flexion → développé → soulevé) puis les tours 1→2→3 ; le premier tour comportant
 * un essai **annoncé** (`pending`) est le tour courant. Au sein d'un tour, l'ordre de passage
 * est par **charge croissante**, départagé par **numéro de lot** croissant.
 */
export function computeLive(athletes: Athlete[]): LiveState {
  let activeLift: LiftKey | null = null;
  let activeRound = -1;

  outer: for (const key of LIFT_ORDER) {
    for (let rnd = 0; rnd < 3; rnd++) {
      const states = athletes.map((a) => a.lifts[key][rnd]?.status ?? 'empty');
      const hasPending = states.includes('pending');
      if (hasPending) {
        activeLift = key;
        activeRound = rnd;
        break outer;
      }
      const anyValue = states.some((s) => s !== 'empty');
      if (anyValue) continue; // tour terminé (jugé sans annonce restante) → tour suivant
      break; // tour vide → la compétition n'est pas encore arrivée ici
    }
  }

  if (activeLift === null) return { lift: null, attemptNo: 0, current: null, onDeck: [] };

  const pending = athletes
    .filter((a) => a.lifts[activeLift!][activeRound]?.status === 'pending')
    .sort(
      (x, y) =>
        orderKey(x, activeLift!, activeRound) - orderKey(y, activeLift!, activeRound) ||
        lotOf(x) - lotOf(y),
    );

  const queue: LiveLifter[] = pending.map((a) => ({
    athlete: a,
    lift: activeLift!,
    attemptNo: activeRound + 1,
    weight: a.lifts[activeLift!][activeRound]?.weight ?? null,
  }));

  return {
    lift: activeLift,
    attemptNo: activeRound + 1,
    current: queue[0] ?? null,
    onDeck: queue.slice(1),
  };
}

function orderKey(a: Athlete, lift: LiftKey, round: number): number {
  const wt = a.lifts[lift][round]?.weight;
  return wt && wt > 0 ? wt : 99999;
}

function lotOf(a: Athlete): number {
  return a.lot ?? 99999;
}
