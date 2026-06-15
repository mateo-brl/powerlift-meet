import type { Athlete, AthleteResult } from './types.js';
import { indice, indiceRounded, roundUp } from './indices.js';
import { ageCategory } from './age.js';
import { weightCategory } from './categories.js';
import { bestByLift, totalAnnonce, totalRealise } from './totals.js';
import { niveau } from './levels.js';

/** Résultats d'un athlète **hors classement** (place renseignée par {@link computeResults}). */
export function computeAthleteResult(a: Athlete): AthleteResult {
  const discipline = a.discipline ?? 'FA';
  const catAge = ageCategory(discipline, a.birthYear);
  const catPoids = weightCategory(a.sex, discipline, catAge, a.bodyweight);
  const ind = indiceRounded(discipline, a.sex, a.bodyweight);
  const realise = totalRealise(a);
  // Points fédéraux (col. X) : ROUNDUP(indice_brut × total, 6).
  const points = roundUp(indice(discipline, a.sex, a.bodyweight) * realise, 6);
  return {
    catAge,
    catPoids,
    indice: ind,
    best: bestByLift(a),
    totalAnnonce: totalAnnonce(a),
    totalRealise: realise,
    points,
    place: null,
    niveau: niveau(discipline, a.sex, catAge, catPoids, realise, false),
    niveauOpen: niveau(discipline, a.sex, catAge, catPoids, realise, true),
  };
}

/**
 * Calcule les résultats de tout le plateau et attribue les places par catégorie
 * (`sexe` × `cat. d'âge` × `cat. de poids`). Départage fédéral : total décroissant, puis
 * poids de corps croissant, puis numéro de lot croissant. Place nulle si total nul ou hors match.
 *
 * @returns une `Map` indexée par `athlete.row`.
 */
export function computeResults(athletes: Athlete[]): Map<number, AthleteResult> {
  const results = new Map<number, AthleteResult>();
  for (const a of athletes) results.set(a.row, computeAthleteResult(a));

  const groups = new Map<string, Athlete[]>();
  for (const a of athletes) {
    if (a.horsMatch) continue;
    const r = results.get(a.row)!;
    const key = `${a.sex}|${r.catAge}|${r.catPoids}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(a);
  }

  for (const grp of groups.values()) {
    grp.sort((x, y) => {
      const rx = results.get(x.row)!;
      const ry = results.get(y.row)!;
      if (ry.totalRealise !== rx.totalRealise) return ry.totalRealise - rx.totalRealise;
      const bx = x.bodyweight ?? Infinity;
      const by = y.bodyweight ?? Infinity;
      if (bx !== by) return bx - by;
      return (x.lot ?? Infinity) - (y.lot ?? Infinity);
    });
    grp.forEach((a, i) => {
      const r = results.get(a.row)!;
      r.place = r.totalRealise > 0 ? i + 1 : null;
    });
  }
  return results;
}
