import { describe, expect, it } from 'vitest';
import { computeLive, computeResults, totalAnnonce, totalRealise } from '../src/index.js';
import type { Athlete, Attempt, AttemptStatus, Lifts } from '../src/index.js';

/** Construit un essai depuis une notation courte : `190` annoncé, `190g` réussi, `190f` manqué. */
function att(spec: number | string | null): Attempt {
  if (spec == null) return { weight: null, status: 'empty' };
  if (typeof spec === 'number') return { weight: spec, status: 'pending' };
  const m = /^(\d+(?:\.\d+)?)([gf])?$/.exec(spec);
  if (!m) throw new Error(`spec invalide: ${spec}`);
  const weight = Number(m[1]);
  const status: AttemptStatus = m[2] === 'g' ? 'good' : m[2] === 'f' ? 'fail' : 'pending';
  return { weight, status };
}

function lifts(sq: unknown[], dc: unknown[], sdt: unknown[]): Lifts {
  const map = (xs: unknown[]) => [0, 1, 2].map((i) => att((xs[i] ?? null) as never));
  return { squat: map(sq), bench: map(dc), deadlift: map(sdt) };
}

function athlete(over: Partial<Athlete> & { row: number }): Athlete {
  return {
    licence: '000000',
    club: 'TEST',
    sex: 'M',
    birthYear: 2000,
    firstName: 'Jean',
    lastName: 'Test',
    bodyweight: 83,
    lot: over.row,
    discipline: 'FA',
    horsMatch: false,
    lifts: lifts([], [], []),
    ...over,
  };
}

describe('totaux', () => {
  it('total réalisé = somme des meilleurs essais réussis', () => {
    const a = athlete({
      row: 1,
      lifts: lifts(['200g', '210g', '215f'], ['120g', '130g'], ['220g', '230f']),
    });
    expect(totalRealise(a)).toBe(210 + 130 + 220);
  });

  it('mouvement entièrement manqué → total nul', () => {
    const a = athlete({ row: 1, lifts: lifts(['200f', '200f', '200f'], ['120g'], ['220g']) });
    expect(totalRealise(a)).toBe(0);
  });

  it('total annoncé projette les charges en cours', () => {
    const a = athlete({ row: 1, lifts: lifts(['200g', '210'], ['120'], ['220']) });
    expect(totalAnnonce(a)).toBe(210 + 120 + 220);
  });
});

describe('classement', () => {
  it('départage par poids de corps puis lot à total égal', () => {
    const a = athlete({
      row: 1,
      bodyweight: 82,
      lot: 5,
      lifts: lifts(['300g'], ['200g'], ['250g']),
    });
    const b = athlete({
      row: 2,
      bodyweight: 80,
      lot: 9,
      lifts: lifts(['300g'], ['200g'], ['250g']),
    });
    const res = computeResults([a, b]);
    expect(res.get(2)!.place).toBe(1); // plus léger devant
    expect(res.get(1)!.place).toBe(2);
  });

  it('total nul → pas de place', () => {
    const a = athlete({ row: 1, lifts: lifts(['300f', '300f', '300f'], [], []) });
    expect(computeResults([a]).get(1)!.place).toBeNull();
  });

  it('catégories séparées classées indépendamment', () => {
    const a = athlete({ row: 1, bodyweight: 70, lifts: lifts(['300g'], ['200g'], ['250g']) }); // 74kg
    const b = athlete({ row: 2, bodyweight: 90, lifts: lifts(['250g'], ['150g'], ['200g']) }); // 93kg
    const res = computeResults([a, b]);
    expect(res.get(1)!.place).toBe(1);
    expect(res.get(2)!.place).toBe(1);
  });
});

describe('ordre de passage', () => {
  it('barre la plus légère en cours, départage au lot', () => {
    const a = athlete({ row: 1, lot: 3, lifts: lifts([200], [], []) });
    const b = athlete({ row: 2, lot: 1, lifts: lifts([200], [], []) });
    const c = athlete({ row: 3, lot: 9, lifts: lifts([195], [], []) });
    const live = computeLive([a, b, c]);
    expect(live.lift).toBe('squat');
    expect(live.attemptNo).toBe(1);
    expect(live.current!.athlete.row).toBe(3); // 195 d'abord
    expect(live.onDeck.map((l) => l.athlete.row)).toEqual([2, 1]); // 200 lot1 puis lot3
  });

  it('passe au développé une fois les squats jugés', () => {
    const a = athlete({ row: 1, lifts: lifts(['200g', '210g', '215g'], [120], []) });
    const live = computeLive([a]);
    expect(live.lift).toBe('bench');
  });

  it('aucune barre annoncée → pas de lifter courant', () => {
    const a = athlete({ row: 1, lifts: lifts(['200g'], [], []) });
    expect(computeLive([a]).current).toBeNull();
  });
});
