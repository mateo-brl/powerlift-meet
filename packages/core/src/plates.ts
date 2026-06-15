/**
 * Calcul du chargement de la barre pour l'écran « Chargeur ».
 *
 * Charge par côté = (charge_totale − barre − 2×collier) / 2, puis répartition gloutonne du
 * disque le plus lourd au plus léger. Couleurs IPF des disques.
 */

export interface PlateColor {
  /** Couleur de fond du disque (CSS). */
  bg: string;
  /** Couleur du texte lisible sur ce fond. */
  fg: string;
}

/** Couleurs IPF officielles des disques (kg → couleur). */
export const PLATE_COLORS: Record<string, PlateColor> = {
  '25': { bg: '#d50000', fg: '#ffffff' }, // rouge
  '20': { bg: '#1565c0', fg: '#ffffff' }, // bleu
  '15': { bg: '#f9c000', fg: '#1a1a1a' }, // jaune
  '10': { bg: '#1f8a36', fg: '#ffffff' }, // vert
  '5': { bg: '#ffffff', fg: '#1a1a1a' }, // blanc
  '2.5': { bg: '#1a1a1a', fg: '#ffffff' }, // noir
  '1.25': { bg: '#c8ccd0', fg: '#1a1a1a' }, // chrome
  '0.5': { bg: '#c8ccd0', fg: '#1a1a1a' },
  '0.25': { bg: '#c8ccd0', fg: '#1a1a1a' },
};

/** Disques disponibles (kg), du plus lourd au plus léger — comme l'écran fédéral. */
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25] as const;

export interface PlateConfig {
  /** Poids de la barre (kg). 20 par défaut (barre olympique). */
  barWeight: number;
  /** Poids d'un collier de serrage par côté (kg). 2,5 par défaut. */
  collarWeight: number;
  /** Tailles de disques disponibles (kg). */
  plates: readonly number[];
}

export const DEFAULT_PLATE_CONFIG: PlateConfig = {
  barWeight: 20,
  collarWeight: 2.5,
  plates: DEFAULT_PLATES,
};

export interface PlateOnSide {
  weight: number;
  count: number;
  color: PlateColor;
}

export interface PlateLoad {
  target: number;
  /** Disques par côté (hors collier), du plus lourd au plus léger. */
  perSide: PlateOnSide[];
  /** Charge effectivement réalisable (≤ target si la barre ne tombe pas juste). */
  achievable: number;
  /** Reliquat non réalisable avec les disques disponibles (kg, 0 si exact). */
  remainder: number;
  /** Vrai si la charge demandée est inférieure à barre + colliers. */
  belowBar: boolean;
}

/**
 * Répartit la charge en disques par côté.
 *
 * @example
 * loadBar(190) // 3×25 + 1×5 + 1×2,5 par côté (barre 20 + colliers 2×2,5)
 */
export function loadBar(target: number, config: Partial<PlateConfig> = {}): PlateLoad {
  const { barWeight, collarWeight, plates } = { ...DEFAULT_PLATE_CONFIG, ...config };
  const base = barWeight + 2 * collarWeight;

  if (target < base) {
    return { target, perSide: [], achievable: base, remainder: 0, belowBar: true };
  }

  let perSideRemaining = (target - base) / 2;
  const perSide: PlateOnSide[] = [];
  for (const p of plates) {
    const count = Math.floor((perSideRemaining + 1e-9) / p);
    if (count > 0) {
      perSide.push({
        weight: p,
        count,
        color: PLATE_COLORS[String(p)] ?? { bg: '#888', fg: '#fff' },
      });
      perSideRemaining = round3(perSideRemaining - count * p);
    }
  }

  const loadedPerSide = perSide.reduce((s, x) => s + x.weight * x.count, 0);
  const achievable = round3(base + 2 * loadedPerSide);
  return { target, perSide, achievable, remainder: round3(target - achievable), belowBar: false };
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
