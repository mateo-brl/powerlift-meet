import { useEffect, useState } from 'react';
import type { AppState, DesktopApi } from '../../shared/types.js';

declare global {
  interface Window {
    api: DesktopApi;
  }
}

export const api = window.api;

const EMPTY: AppState = {
  folder: null,
  plateaux: [],
  activePlateauId: null,
  active: null,
  override: null,
  competitionType: 'FA/PL Clas. par Cat.',
  options: { finalesOpen: false, chargerRecords: false, genererVmix: false },
  bar: { barWeight: 20, collarWeight: 2.5 },
  openScreens: { feuille: false, joueur: false, chargeur: false, ordre: false },
  error: null,
};

/** Abonnement à l'état applicatif diffusé par le process principal. */
export function useAppState(): AppState {
  const [state, setState] = useState<AppState>(EMPTY);
  useEffect(() => {
    let mounted = true;
    void api.getState().then((s) => mounted && setState(s));
    const off = api.onState((s) => setState(s));
    return () => {
      mounted = false;
      off();
    };
  }, []);
  return state;
}
