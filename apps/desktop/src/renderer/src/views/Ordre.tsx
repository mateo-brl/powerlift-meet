import { LIFT_LABELS } from '@powerlift-meet/core';
import { useAppState } from '../api.js';
import { useComputed } from '../live.js';
import { EmptyScreen } from './Empty.js';

export function Ordre(): JSX.Element {
  const state = useAppState();
  const { live, meta } = useComputed(state);
  if (!live.current) return <EmptyScreen title="ORDRE DE PASSAGE" subtitle={meta?.competition} />;

  const queue = [live.current, ...live.onDeck];

  return (
    <div className="screen ordre">
      <h2>
        {LIFT_LABELS[live.lift!]} · Essai {live.attemptNo}
      </h2>
      {queue.map((l, i) => (
        <div key={l.athlete.row} className={`item${i === 0 ? ' first' : ''}`}>
          <span className="lot">Lot {l.athlete.lot}</span>
          <span>
            {l.athlete.lastName} {l.athlete.firstName}
            <span className="lot"> · {l.athlete.club}</span>
          </span>
          <span className="wt">{l.weight ?? '—'} kg</span>
        </div>
      ))}
    </div>
  );
}
