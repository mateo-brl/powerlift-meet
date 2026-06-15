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

  return (
    <div className="screen joueur">
      <div className="club">{a.club}</div>
      <div className="name">
        {a.lastName} {a.firstName}
      </div>
      <div className="chips">
        <span className="chip">{r?.catAge}</span>
        <span className="chip">{r?.catPoids}</span>
        <span className="chip">{a.bodyweight?.toFixed(1)} kg</span>
        <span className="chip">Lot {a.lot}</span>
      </div>
      <div className="move">
        {LIFT_LABELS[cur.lift]} · Essai {cur.attemptNo}
      </div>
      <div className="big">{cur.weight ?? '—'} kg</div>
    </div>
  );
}
