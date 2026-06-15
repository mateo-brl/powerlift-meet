/** Sexe fédéral. */
export type Sex = 'M' | 'F';

/**
 * Discipline. `FA` = Force Athlétique (squat + développé couché + soulevé de terre),
 * `PL` = Powerlifting / Développé Couché selon le classeur fédéral (indices dédiés).
 */
export type Discipline = 'FA' | 'PL';

/** Mouvement (barre). */
export type LiftKey = 'squat' | 'bench' | 'deadlift';

/**
 * Statut d'un essai, déduit dans le modèle fédéral de la couleur de la cellule :
 * - `good`   : essai réussi (cellule verte, RGB 65280) ;
 * - `fail`   : essai manqué (cellule mauve barrée, RGB 16761024) ;
 * - `pending`: barre annoncée, pas encore jugée (charge saisie, fond neutre) ;
 * - `empty`  : aucun essai (cellule vide).
 */
export type AttemptStatus = 'good' | 'fail' | 'pending' | 'empty';

/** Un essai : charge annoncée (kg) et statut. */
export interface Attempt {
  weight: number | null;
  status: AttemptStatus;
}

/** Les 3 essais de chacun des 3 mouvements. Chaque tableau a toujours 3 éléments (essais 1‑3). */
export interface Lifts {
  squat: Attempt[];
  bench: Attempt[];
  deadlift: Attempt[];
}

/** Un athlète sur un plateau, tel que lu dans la feuille `FA`. */
export interface Athlete {
  /** Ligne Excel d'origine (9‑28), sert d'identifiant stable sur le plateau. */
  row: number;
  licence: string;
  club: string;
  sex: Sex;
  /** Année de naissance (suffit pour la catégorie d'âge). */
  birthYear: number | null;
  firstName: string;
  lastName: string;
  bodyweight: number | null;
  lot: number | null;
  discipline: Discipline | null;
  lifts: Lifts;
  /** Athlète hors match (non classé). */
  horsMatch: boolean;
}

/** Résultats calculés pour un athlète (dérivés de {@link Athlete}). */
export interface AthleteResult {
  catAge: string;
  catPoids: string;
  indice: number;
  /** Meilleur essai réussi par mouvement (0 si aucun). */
  best: Record<LiftKey, number>;
  totalAnnonce: number;
  totalRealise: number;
  points: number;
  place: number | null;
  /** Niveau dans la catégorie d'âge réelle (dépt./R3…/Monde). */
  niveau: string;
  /** Niveau au classement Open (catégorie senior). */
  niveauOpen: string;
}

/** Liste ordonnée des indices d'essai (1‑3) par mouvement, dans l'ordre chronologique fédéral. */
export const LIFT_ORDER: LiftKey[] = ['squat', 'bench', 'deadlift'];

/** Libellés français des mouvements (affichage). */
export const LIFT_LABELS: Record<LiftKey, string> = {
  squat: 'Flexion de jambes',
  bench: 'Développé couché',
  deadlift: 'Soulevé de terre',
};
