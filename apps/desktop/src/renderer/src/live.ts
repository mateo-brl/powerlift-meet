import { useMemo } from 'react';
import {
  computeLive,
  computeResults,
  type Athlete,
  type AthleteResult,
  type LiveState,
} from '@powerlift-meet/core';
import type { AppState, PlateauData } from '../../shared/types.js';

export interface ComputedView {
  athletes: Athlete[];
  results: Map<number, AthleteResult>;
  live: LiveState;
  meta: PlateauData['meta'] | null;
}

/** Calcule, depuis l'état diffusé, les résultats et l'état « live » (forçage manuel inclus). */
export function useComputed(state: AppState): ComputedView {
  return useMemo(() => {
    const athletes = state.active?.athletes ?? [];
    const results = computeResults(athletes);
    let live = computeLive(athletes);

    const o = state.override;
    if (o) {
      const a = athletes.find((x) => x.row === o.row);
      if (a) {
        const weight = o.weight ?? a.lifts[o.lift][o.attemptNo - 1]?.weight ?? null;
        live = {
          lift: o.lift,
          attemptNo: o.attemptNo,
          current: { athlete: a, lift: o.lift, attemptNo: o.attemptNo, weight },
          onDeck: live.onDeck.filter((l) => l.athlete.row !== a.row),
        };
      }
    }

    return { athletes, results, live, meta: state.active?.meta ?? null };
  }, [state.active, state.override]);
}
