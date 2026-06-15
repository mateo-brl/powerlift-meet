import { describe, expect, it } from 'vitest';
import { ageCategory, indiceRounded, weightCategory } from '../src/index.js';
import type { Discipline, Sex } from '../src/index.js';
import golden from './fixtures/golden-athletes.json' with { type: 'json' };

interface GoldenRow {
  id: string;
  sexe: string;
  birthYear: number | null;
  bodyweight: number | null;
  discipline: string | null;
  expected: { catAge: string | null; catPoids: string | null; indice: number | null };
}

/**
 * Validation « au point près » contre les valeurs calculées par le classeur Excel fédéral
 * (extraites en `data_only`, anonymisées). Garantit que le moteur reproduit la fédération
 * pour la catégorie d'âge, la catégorie de poids et l'indice IPF.
 */
describe('golden — valeurs calculées par Excel', () => {
  const rows = (golden as GoldenRow[]).filter((r) => r.discipline);

  it('a bien des échantillons à valider', () => {
    expect(rows.length).toBeGreaterThan(20);
  });

  for (const r of rows) {
    it(`${r.id} (${r.sexe} ${r.birthYear} ${r.bodyweight}kg ${r.discipline})`, () => {
      const disc = r.discipline as Discipline;
      const sex = r.sexe as Sex;
      const catAge = ageCategory(disc, r.birthYear);
      expect(catAge).toBe(r.expected.catAge);
      expect(weightCategory(sex, disc, catAge, r.bodyweight)).toBe(r.expected.catPoids);
      if (r.expected.indice != null) {
        expect(indiceRounded(disc, sex, r.bodyweight)).toBeCloseTo(r.expected.indice, 6);
      }
    });
  }
});
