import type { Athlete, LiftKey } from '@powerlift-meet/core';

/** Identifiants des 4 écrans de salle. */
export type ScreenName = 'feuille' | 'joueur' | 'chargeur' | 'ordre';

export const SCREENS: ScreenName[] = ['feuille', 'joueur', 'chargeur', 'ordre'];

export const SCREEN_LABELS: Record<ScreenName, string> = {
  feuille: 'Feuille',
  joueur: 'Joueur',
  chargeur: 'Chargeur',
  ordre: 'Ordre',
};

/** Métadonnées légères d'un plateau (pour la liste de sélection). */
export interface PlateauInfo {
  id: string;
  label: string;
  file: string;
  discipline: string;
  nAthletes: number;
  /** Ancienneté de la dernière lecture du fichier (secondes). */
  freshSeconds: number;
}

/** Plateau complet diffusé aux écrans (sérialisable). */
export interface PlateauData {
  id: string;
  meta: {
    competition: string | null;
    date: string | null;
    year: number | null;
    place: string | null;
  };
  athletes: Athlete[];
}

/** Forçage manuel de l'athlète en cours (régie). */
export interface Override {
  row: number;
  lift: LiftKey;
  /** Numéro d'essai 1‑3. */
  attemptNo: number;
  weight: number | null;
}

export interface AppOptions {
  finalesOpen: boolean;
  chargerRecords: boolean;
  genererVmix: boolean;
}

/** Configuration du chargeur (matériel disponible). */
export interface BarConfig {
  barWeight: number;
  collarWeight: number;
}

/** État applicatif complet, diffusé du process principal vers tous les écrans. */
export interface AppState {
  folder: string | null;
  plateaux: PlateauInfo[];
  activePlateauId: string | null;
  active: PlateauData | null;
  override: Override | null;
  competitionType: string;
  options: AppOptions;
  bar: BarConfig;
  /** Écrans actuellement ouverts. */
  openScreens: Record<ScreenName, boolean>;
  error: string | null;
}

export const COMPETITION_TYPES = [
  'FA/PL Clas. par Cat.',
  'FA/PL Clas. Open',
  'DC Clas. par Cat.',
  'DC Clas. Open',
] as const;

/** API exposée au renderer via contextBridge. */
export interface DesktopApi {
  getState(): Promise<AppState>;
  onState(cb: (state: AppState) => void): () => void;
  chooseFolder(): Promise<void>;
  setActivePlateau(id: string): Promise<void>;
  openScreen(name: ScreenName): Promise<void>;
  closeScreen(name: ScreenName): Promise<void>;
  setOverride(o: Override | null): Promise<void>;
  setOptions(o: Partial<AppOptions>): Promise<void>;
  setCompetitionType(t: string): Promise<void>;
  setBar(b: Partial<BarConfig>): Promise<void>;
  /** Identité de la fenêtre courante (renseignée par le hash). */
  screen: ScreenName | 'control';
}
