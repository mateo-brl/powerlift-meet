import { LIFT_LABELS } from '@powerlift-meet/core';
import { useAppState } from '../api.js';
import { useComputed } from '../live.js';
import { EmptyScreen } from './Empty.js';

export function Joueur(): JSX.Element {
  const state = useAppState();
  const { live, results, meta } = useComputed(state);
  const cur = live.current;
  if (!cur) return <EmptyScreen title="JOUEUR" subtitle={meta?.competition} />;

  const a = cur.athlete;
  const r = results.get(a.row);
  const attempts = a.lifts[cur.lift];

  return (
    <div className="screen joueur">
      <div className="j-club">{a.club}</div>
      <div className="j-name">
        {a.lastName} {a.firstName}
      </div>
      <div className="j-move">{LIFT_LABELS[cur.lift]}</div>
      <div className="j-grid">
        <div className="h">Cat. poids</div>
        <div className="h">Essai 1</div>
        <div className="h">Essai 2</div>
        <div className="h">Essai 3</div>
        <div className="v">{r?.catPoids ?? '—'}</div>
        {[0, 1, 2].map((i) => {
          const at = attempts[i]!;
          const cls = at.status === 'good' ? 'att-good' : at.status === 'fail' ? 'att-fail' : '';
          return (
            <div key={i} className={`v ${cls}`}>
              {at.weight ?? '—'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
