import type { AttemptStatus } from '@powerlift-meet/core';
import type { Cell } from 'exceljs';

/**
 * Palette de détection des essais. Calquée sur le modèle fédéral et l'outil de calibration
 * de l'overlay : vert = réussi, mauve = manqué. Les valeurs sont des hex RGB (sans alpha).
 */
export interface ColorPalette {
  good: string[];
  fail: string[];
  useStrike: boolean;
}

export const DEFAULT_PALETTE: ColorPalette = {
  good: ['00FF00', '008000'],
  fail: ['C0C0FF', '9999FF', 'CCCCFF'],
  useStrike: true,
};

/** Extrait l'hex RGB (6 car., majuscules) d'une couleur exceljs, ou `null`. */
function fillRgb(cell: Cell): string | null {
  const fill = cell.fill;
  if (!fill || fill.type !== 'pattern' || fill.pattern !== 'solid') return null;
  const fg = fill.fgColor;
  if (!fg) return null;
  if (typeof fg.argb === 'string') {
    const s = fg.argb.toUpperCase();
    return s.length >= 6 ? s.slice(-6) : null;
  }
  return null; // couleurs indexées/thème non gérées (traitées comme neutres)
}

function isGreenish(rgb: string): boolean {
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  return g >= 110 && g > r + 40 && g > b + 40;
}

/** Numérise la charge d'une cellule d'essai (gère « -150 » = manqué d'office). */
export function cellWeight(cell: Cell): number | null {
  const v = cell.value;
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Détermine le statut d'un essai à partir de la cellule (valeur + remplissage + barré),
 * en reproduisant `classify_attempt` de l'overlay.
 */
export function classifyAttempt(
  cell: Cell,
  palette: ColorPalette = DEFAULT_PALETTE,
): {
  status: AttemptStatus;
  weight: number | null;
} {
  const weight = cellWeight(cell);
  if (weight == null) return { status: 'empty', weight: null };

  // Charge négative : manqué d'office (convention de saisie).
  if (weight < 0) return { status: 'fail', weight: Math.abs(weight) };

  // Texte barré = essai manqué (le modèle barre les manques).
  if (palette.useStrike && cell.font?.strike) return { status: 'fail', weight };

  const rgb = fillRgb(cell);
  if (rgb) {
    if (palette.good.includes(rgb) || isGreenish(rgb)) return { status: 'good', weight };
    if (palette.fail.includes(rgb)) return { status: 'fail', weight };
    if (rgb === 'FFFFFF') return { status: 'pending', weight };
    // Couleur inconnue mais présente : on suppose un manque (mauve atypique).
    return { status: 'fail', weight };
  }

  // Charge saisie sans couleur de jugement : barre annoncée.
  return { status: 'pending', weight };
}
