import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import type { Athlete, Attempt, Discipline, LiftKey, Sex } from '@powerlift-meet/core';
import { classifyAttempt, type ColorPalette, DEFAULT_PALETTE } from './colors.js';

/** Métadonnées d'un plateau (en-tête de la feuille `FA`). */
export interface PlateauMeta {
  /** Intitulé de la compétition (cellule Q5/N5). */
  competition: string | null;
  /** Date de la compétition (ISO `YYYY-MM-DD`). */
  date: string | null;
  year: number | null;
  /** Lieu / club organisateur (cellule F3). */
  place: string | null;
}

export interface Plateau {
  meta: PlateauMeta;
  athletes: Athlete[];
}

// Mapping colonnes de la feuille `FA` (1‑based), confirmé sur les feuilles fédérales.
const COL = {
  licence: 1,
  club: 2,
  sex: 3,
  dob: 4,
  lastName: 6,
  firstName: 7,
  bodyweight: 8,
  lot: 11,
  discipline: 27,
} as const;

/** Colonnes des 3 essais par mouvement (L‑N squat, O‑Q développé, R‑T soulevé). */
const LIFT_COLS: Record<LiftKey, [number, number, number]> = {
  squat: [12, 13, 14],
  bench: [15, 16, 17],
  deadlift: [18, 19, 20],
};

const FIRST_ROW = 9;
const LAST_ROW = 28;

function str(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'object' && 'result' in v)
    return String((v as { result: unknown }).result ?? '');
  if (typeof v === 'object' && 'text' in v) return String((v as { text: unknown }).text ?? '');
  return String(v).trim();
}

function num(v: ExcelJS.CellValue): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function year(v: ExcelJS.CellValue): number | null {
  if (v instanceof Date) return v.getUTCFullYear();
  return null;
}

function isRedFont(cell: ExcelJS.Cell): boolean {
  const argb = cell.font?.color?.argb;
  if (!argb || argb.length < 6) return false;
  const rgb = argb.slice(-6).toUpperCase();
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  return r >= 150 && g < 90 && b < 90;
}

function readMeta(ws: ExcelJS.Worksheet): PlateauMeta {
  const competition = str(ws.getCell('Q5').value) || str(ws.getCell('N5').value) || null;
  const dateVal = ws.getCell('F4').value;
  let date: string | null = null;
  let yr: number | null = null;
  if (dateVal instanceof Date) {
    yr = dateVal.getUTCFullYear();
    date = dateVal.toISOString().slice(0, 10);
  }
  const place = str(ws.getCell('F3').value) || null;
  return { competition, date, year: yr, place };
}

function readAttempts(
  ws: ExcelJS.Worksheet,
  row: number,
  palette: ColorPalette,
): Record<LiftKey, Attempt[]> {
  const out = {} as Record<LiftKey, Attempt[]>;
  for (const lift of Object.keys(LIFT_COLS) as LiftKey[]) {
    out[lift] = LIFT_COLS[lift].map((col) => {
      const { status, weight } = classifyAttempt(ws.getCell(row, col), palette);
      return { status, weight };
    });
  }
  return out;
}

/** Construit le modèle de domaine d'un plateau depuis une feuille `FA` exceljs déjà chargée. */
export function readPlateauSheet(
  ws: ExcelJS.Worksheet,
  palette: ColorPalette = DEFAULT_PALETTE,
): Plateau {
  const athletes: Athlete[] = [];
  for (let row = FIRST_ROW; row <= LAST_ROW; row++) {
    const lastName = str(ws.getCell(row, COL.lastName).value);
    const bodyweight = num(ws.getCell(row, COL.bodyweight).value);
    const sexRaw = str(ws.getCell(row, COL.sex).value).toUpperCase();
    if (!lastName && bodyweight == null) continue; // ligne vide

    const lifts = readAttempts(ws, row, palette);
    athletes.push({
      row,
      licence: str(ws.getCell(row, COL.licence).value),
      club: str(ws.getCell(row, COL.club).value),
      sex: sexRaw === 'F' ? 'F' : ('M' as Sex),
      birthYear: year(ws.getCell(row, COL.dob).value),
      firstName: str(ws.getCell(row, COL.firstName).value),
      lastName,
      bodyweight,
      lot: num(ws.getCell(row, COL.lot).value),
      discipline: (str(ws.getCell(row, COL.discipline).value).toUpperCase() || 'FA') as Discipline,
      horsMatch: isRedFont(ws.getCell(row, COL.lastName)),
      lifts,
    });
  }
  return { meta: readMeta(ws), athletes };
}

/** Lit un fichier `.xlsm`/`.xlsx` de feuille de match (lecture seule). */
export async function readPlateauFile(
  path: string,
  palette: ColorPalette = DEFAULT_PALETTE,
): Promise<Plateau> {
  const wb = new ExcelJS.Workbook();
  // On passe par un Buffer pour ne jamais poser de verrou sur le fichier fédéral.
  const buf = await readFile(path);
  // exceljs attend un Buffer ; on transmet la vue ArrayBuffer sous-jacente pour éviter
  // l'incompatibilité de types entre les versions de @types/node.
  await wb.xlsx.load(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
  );
  const ws = wb.getWorksheet('FA') ?? wb.worksheets[0];
  if (!ws) throw new Error(`Aucune feuille exploitable dans ${path}`);
  return readPlateauSheet(ws, palette);
}

export { classifyAttempt, cellWeight, DEFAULT_PALETTE } from './colors.js';
export type { ColorPalette } from './colors.js';
