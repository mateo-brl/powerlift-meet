import { describe, expect, it } from 'vitest';
import { ageCategory, indice, loadBar, niveau, weightCategory } from '../src/index.js';

describe('indice IPF', () => {
  it('homme FA ~83 kg', () => {
    expect(indice('FA', 'M', 83)).toBeCloseTo(0.138427, 5);
  });
  it('retourne 0 sans poids', () => {
    expect(indice('FA', 'M', null)).toBe(0);
    expect(indice('PL', 'F', 0)).toBe(0);
  });
  it('décroît avec le poids de corps', () => {
    expect(indice('FA', 'M', 60)).toBeGreaterThan(indice('FA', 'M', 120));
  });
});

describe('catégorie d’âge (table Cat. d’âge)', () => {
  it('2002 FA → SNR', () => expect(ageCategory('FA', 2002)).toBe('SNR'));
  it('1986 FA → M1', () => expect(ageCategory('FA', 1986)).toBe('M1'));
  it('2012 FA → SJR', () => expect(ageCategory('FA', 2012)).toBe('SJR'));
  it('année inconnue → ""', () => expect(ageCategory('FA', null)).toBe(''));
});

describe('catégorie de poids', () => {
  it('homme FA senior 82,5 → 83 Kg', () =>
    expect(weightCategory('M', 'FA', 'SNR', 82.5)).toBe('83 Kg'));
  it('homme FA senior 130 → +120 Kg', () =>
    expect(weightCategory('M', 'FA', 'SNR', 130)).toBe('+120 Kg'));
  it('homme FA junior 53 → 53 Kg (tranche junior plus basse)', () =>
    expect(weightCategory('M', 'FA', 'JR', 53)).toBe('53 Kg'));
  it('homme FA senior 55 → 59 Kg (pas de catégorie 53 en senior)', () =>
    expect(weightCategory('M', 'FA', 'SNR', 55)).toBe('59 Kg'));
  it('femme FA junior 43 → 43 Kg', () => expect(weightCategory('F', 'FA', 'JR', 43)).toBe('43 Kg'));
  it('femme PL 84 → 84 Kg, 85 → +84 Kg', () => {
    expect(weightCategory('F', 'PL', 'SNR', 84)).toBe('84 Kg');
    expect(weightCategory('F', 'PL', 'SNR', 85)).toBe('+84 Kg');
  });
  it('interdit → "0"', () => expect(weightCategory('M', 'FA', 'INTERDIT', 80)).toBe('0'));
});

describe('chargeur (loadBar)', () => {
  it('190 kg → 3×25 + 1×5 + 1×2,5 par côté', () => {
    const load = loadBar(190);
    expect(load.perSide).toEqual([
      expect.objectContaining({ weight: 25, count: 3 }),
      expect.objectContaining({ weight: 5, count: 1 }),
      expect.objectContaining({ weight: 2.5, count: 1 }),
    ]);
    expect(load.achievable).toBe(190);
    expect(load.remainder).toBe(0);
  });
  it('charge sous la barre + colliers', () => {
    expect(loadBar(20).belowBar).toBe(true);
  });
  it('25 kg = barre + colliers, aucun disque', () => {
    const load = loadBar(25);
    expect(load.perSide).toHaveLength(0);
    expect(load.belowBar).toBe(false);
  });
  it('charge non réalisable signale un reliquat', () => {
    const load = loadBar(25.3);
    expect(load.remainder).toBeGreaterThan(0);
  });
});

describe('niveaux (grille Niv FA)', () => {
  it('homme FA SNR 83 Kg, 670 → R1', () => {
    expect(niveau('FA', 'M', 'SNR', '83 Kg', 670)).toBe('R1');
  });
  it('homme FA SNR 83 Kg, 810 → Monde', () => {
    expect(niveau('FA', 'M', 'SNR', '83 Kg', 810)).toBe('Monde');
  });
  it('total faible → Dépt.', () => {
    expect(niveau('FA', 'M', 'SNR', '83 Kg', 400)).toBe('Dépt.');
  });
  it('total nul → ""', () => {
    expect(niveau('FA', 'M', 'SNR', '83 Kg', 0)).toBe('');
  });
});
