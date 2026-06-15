import { LIFT_LABELS, type Athlete, type LiftKey } from '@powerlift-meet/core';
import { useAppState } from '../api.js';
import { useComputed } from '../live.js';
import { EmptyScreen } from './Empty.js';

const AGE_ORDER = ['INTERDIT', 'CADET', 'SJR', 'JR', 'SNR', 'M1', 'M2', 'M3', 'M4'];

function catWeightValue(c: string): number {
  const m = /(\d+)/.exec(c);
  const n = m ? Number(m[1]) : 999;
  return c.startsWith('+') ? n + 0.5 : n;
}

function sexSymbol(s: string): string {
  return s === 'F' ? '♀' : '♂';
}

export function Feuille(): JSX.Element {
  const state = useAppState();
  const { athletes, results, live, meta } = useComputed(state);
  if (athletes.length === 0) return <EmptyScreen title="FEUILLE" subtitle={meta?.competition} />;

  const lift: LiftKey = live.lift ?? 'squat';
  const currentRow = live.current?.athlete.row ?? -1;

  // Regroupement par catégorie d'âge puis de poids.
  const groups = new Map<string, Athlete[]>();
  for (const a of athletes) {
    const r = results.get(a.row)!;
    const key = `${r.catAge}|${r.catPoids}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(a);
  }
  const sortedKeys = [...groups.keys()].sort((x, y) => {
    const [ax, wx] = x.split('|');
    const [ay, wy] = y.split('|');
    return (
      AGE_ORDER.indexOf(ax!) - AGE_ORDER.indexOf(ay!) || catWeightValue(wx!) - catWeightValue(wy!)
    );
  });

  return (
    <div className="screen feuille">
      <table>
        <thead>
          <tr>
            <th className="col-name">{LIFT_LABELS[lift].toUpperCase()}</th>
            <th>PdC</th>
            <th>Lot</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>Tot. ann.</th>
            <th>Tot. réa.</th>
            <th>Points</th>
            <th>Clas.</th>
          </tr>
        </thead>
        <tbody>
          {sortedKeys.map((key) => {
            const [age, weight] = key.split('|');
            const list = groups
              .get(key)!
              .slice()
              .sort((a, b) => {
                const ra = results.get(a.row)!;
                const rb = results.get(b.row)!;
                return (ra.place ?? 99) - (rb.place ?? 99) || (a.lot ?? 99) - (b.lot ?? 99);
              });
            return (
              <FragmentGroup
                key={key}
                age={age!}
                weight={weight!}
                list={list}
                lift={lift}
                currentRow={currentRow}
                results={results}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FragmentGroup({
  age,
  weight,
  list,
  lift,
  currentRow,
  results,
}: {
  age: string;
  weight: string;
  list: Athlete[];
  lift: LiftKey;
  currentRow: number;
  results: ReturnType<typeof useComputed>['results'];
}): JSX.Element {
  return (
    <>
      <tr className="cat-row">
        <td colSpan={10}>
          Cat. âge : {age} / Cat. poids : {weight}
        </td>
      </tr>
      {list.map((a) => {
        const r = results.get(a.row)!;
        const isCurrent = a.row === currentRow;
        return (
          <tr key={a.row} className={isCurrent ? 'current' : ''}>
            <td className="col-name">
              {isCurrent && <span className="arrow">▸ </span>}
              <span className="sex">{sexSymbol(a.sex)}</span> {a.lastName} {a.firstName}
            </td>
            <td className="num">{a.bodyweight?.toFixed(1) ?? '—'}</td>
            <td className="num">{a.lot ?? '—'}</td>
            {[0, 1, 2].map((i) => {
              const at = a.lifts[lift][i]!;
              const cls =
                at.status === 'good' ? 'att-good' : at.status === 'fail' ? 'att-fail' : '';
              return (
                <td key={i} className={`num ${cls}`}>
                  {at.weight ?? ''}
                </td>
              );
            })}
            <td className="num">{r.totalAnnonce || ''}</td>
            <td className="num">{r.totalRealise || ''}</td>
            <td className="num">{r.points ? r.points.toFixed(2) : ''}</td>
            <td className="clas">{r.place ?? ''}</td>
          </tr>
        );
      })}
    </>
  );
}
