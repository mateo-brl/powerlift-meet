import type { LiftKey } from '@powerlift-meet/core';
import { useAppState } from '../api.js';
import { useComputed } from '../live.js';
import { EmptyScreen } from './Empty.js';

const SHORT: Record<LiftKey, string> = {
  squat: 'Squat',
  bench: 'Développé',
  deadlift: 'Soulevé',
};

function fmtKg(w: number | null): string {
  return w == null ? '—' : w.toFixed(1).replace('.', ',');
}

export function Ordre(): JSX.Element {
  const state = useAppState();
  const { athletes, live, meta } = useComputed(state);
  if (athletes.length === 0)
    return <EmptyScreen title="ORDRE DE PASSAGE" subtitle={meta?.competition} />;

  const lift: LiftKey = live.lift ?? 'squat';
  const round = (live.attemptNo || 1) - 1;
  const currentRow = live.current?.athlete.row ?? -1;

  // Ordre de passage du tour : tous les athlètes ayant une barre annoncée, charge croissante,
  // départage au numéro de lot.
  const order = athletes
    .map((a) => ({ a, at: a.lifts[lift][round] }))
    .filter((x) => x.at && x.at.weight != null)
    .sort(
      (x, y) =>
        (x.at!.weight ?? 0) - (y.at!.weight ?? 0) || (x.a.lot ?? 99999) - (y.a.lot ?? 99999),
    );

  return (
    <div className="screen ordre">
      <div className="o-title">
        <span className="lift">{SHORT[lift]}</span>
        Ordre de passage
      </div>
      <div className="o-head">
        <div>Ordre</div>
        <div>Athlète</div>
        <div>Poids</div>
        <div>Essai</div>
      </div>
      {order.map((x, i) => (
        <div key={x.a.row} className={`o-row${x.a.row === currentRow ? ' current' : ''}`}>
          <div>{i + 1}</div>
          <div className="athlete">
            {x.a.lastName} {x.a.firstName}
          </div>
          <div>{fmtKg(x.at!.weight)}</div>
          <div>{round + 1}</div>
        </div>
      ))}
    </div>
  );
}
