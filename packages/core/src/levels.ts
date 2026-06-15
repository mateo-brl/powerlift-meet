import type { Discipline, Sex } from './types.js';
import nivFa from './reference/niv-fa.json' with { type: 'json' };
import nivPl from './reference/niv-pl.json' with { type: 'json' };

type Thresholds = Partial<Record<string, number | null>>;
type NivTable = Record<Sex, Record<string, Record<string, Thresholds>>>;

const TABLES: Record<Discipline, NivTable> = {
  FA: nivFa as NivTable,
  PL: nivPl as NivTable,
};

/** Niveaux du plus bas au plus haut. `Dépt.` = en deçà du régional. */
const LEVELS = ['R3', 'R2', 'R1', 'N2', 'N1', 'Europe', 'Monde'] as const;

/**
 * Niveau atteint par un total dans la grille fédérale (`Niv FA` / `Niv PL`).
 * Porte la logique de `niv_homme`/`niv_femme`/`niv_open_*`.
 *
 * @param open `true` pour le classement Open (catégorie senior imposée).
 * @returns `'Dépt.'`, `'R3'`…`'Monde'`, `'SANS'` (cadet), `'0'` (interdit) ou `''`.
 */
export function niveau(
  discipline: Discipline,
  sex: Sex,
  ageCat: string,
  weightCat: string,
  total: number,
  open = false,
): string {
  if (!total || total <= 0) return '';
  if (ageCat === 'INTERDIT' || weightCat === '0') return '0';
  if (ageCat === 'CADET') return 'SANS';

  const table = TABLES[discipline]?.[sex];
  if (!table) return '';

  const wanted = open ? 'SNR' : ageCat;
  const catTable = table[wanted] ?? table['SNR'] ?? table['JR'];
  if (!catTable) return '';

  const thr = catTable[weightCat];
  if (!thr) return '';

  let result = 'Dépt.';
  for (const lvl of LEVELS) {
    const v = thr[lvl];
    if (typeof v === 'number' && total >= v) result = lvl;
  }
  return result;
}
