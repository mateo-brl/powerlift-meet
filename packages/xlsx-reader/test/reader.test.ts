import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { computeLive, computeResults } from '@powerlift-meet/core';
import { classifyAttempt, readPlateauSheet } from '../src/index.js';

function solid(rgb: string) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rgb } } as const;
}

/** Construit une feuille `FA` synthétique (aucune donnée personnelle réelle). */
function buildSheet(): ExcelJS.Worksheet {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('FA');
  ws.getCell('Q5').value = 'COMPÉTITION TEST';
  ws.getCell('F4').value = new Date(Date.UTC(2026, 0, 15));
  ws.getCell('F3').value = 'SALLE TEST';

  // Ligne 9 : athlète A, squat 200 réussi / 210 annoncé
  ws.getCell(9, 2).value = 'CLUB A';
  ws.getCell(9, 3).value = 'M';
  ws.getCell(9, 4).value = new Date(Date.UTC(2000, 5, 1));
  ws.getCell(9, 6).value = 'ALPHA';
  ws.getCell(9, 7).value = 'Jean';
  ws.getCell(9, 8).value = 83;
  ws.getCell(9, 11).value = 5;
  ws.getCell(9, 27).value = 'FA';
  ws.getCell(9, 12).value = 200;
  ws.getCell(9, 12).fill = solid('00FF00'); // vert = réussi
  ws.getCell(9, 13).value = 210; // annoncé (pas de couleur)

  // Ligne 10 : athlète B, squat 195 annoncé (passe avant A car plus léger)
  ws.getCell(10, 2).value = 'CLUB B';
  ws.getCell(10, 3).value = 'M';
  ws.getCell(10, 4).value = new Date(Date.UTC(2001, 2, 3));
  ws.getCell(10, 6).value = 'BRAVO';
  ws.getCell(10, 7).value = 'Paul';
  ws.getCell(10, 8).value = 83;
  ws.getCell(10, 11).value = 2;
  ws.getCell(10, 27).value = 'FA';
  ws.getCell(10, 12).value = 195;

  return ws;
}

describe('classifyAttempt', () => {
  it('cellule verte → réussi', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('t');
    const c = ws.getCell('A1');
    c.value = 200;
    c.fill = solid('00FF00');
    expect(classifyAttempt(c)).toEqual({ status: 'good', weight: 200 });
  });

  it('cellule mauve fédérale → manqué', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('t');
    const c = ws.getCell('A1');
    c.value = 200;
    c.fill = solid('C0C0FF');
    expect(classifyAttempt(c)).toEqual({ status: 'fail', weight: 200 });
  });

  it('texte barré → manqué', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('t');
    const c = ws.getCell('A1');
    c.value = 200;
    c.font = { strike: true };
    expect(classifyAttempt(c)).toEqual({ status: 'fail', weight: 200 });
  });

  it('charge sans couleur → annoncé ; vide → empty', () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('t');
    const c = ws.getCell('A1');
    c.value = 200;
    expect(classifyAttempt(c).status).toBe('pending');
    expect(classifyAttempt(ws.getCell('A2')).status).toBe('empty');
  });
});

describe('readPlateauSheet', () => {
  const sheet = buildSheet();
  const plateau = readPlateauSheet(sheet);

  it('lit les métadonnées', () => {
    expect(plateau.meta.competition).toBe('COMPÉTITION TEST');
    expect(plateau.meta.date).toBe('2026-01-15');
    expect(plateau.meta.place).toBe('SALLE TEST');
  });

  it('lit les athlètes et leurs essais', () => {
    expect(plateau.athletes).toHaveLength(2);
    const a = plateau.athletes[0]!;
    expect(a.lastName).toBe('ALPHA');
    expect(a.birthYear).toBe(2000);
    expect(a.lifts.squat[0]).toEqual({ status: 'good', weight: 200 });
    expect(a.lifts.squat[1]).toEqual({ status: 'pending', weight: 210 });
  });

  it('s’intègre au moteur : classement et ordre de passage', () => {
    const res = computeResults(plateau.athletes);
    expect(res.get(9)!.catAge).toBe('SNR');
    expect(res.get(9)!.totalRealise).toBe(200);

    const live = computeLive(plateau.athletes);
    expect(live.lift).toBe('squat');
    // B (195) passe avant A (210)
    expect(live.current!.athlete.lastName).toBe('BRAVO');
  });
});
