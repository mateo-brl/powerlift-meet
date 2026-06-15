import { DEFAULT_PLATES, LIFT_LABELS, loadBar, PLATE_COLORS } from '@powerlift-meet/core';
import { useAppState } from '../api.js';
import { useComputed } from '../live.js';
import { EmptyScreen } from './Empty.js';

export function Chargeur(): JSX.Element {
  const state = useAppState();
  const { live, meta } = useComputed(state);
  const cur = live.current;
  if (!cur) return <EmptyScreen title="CHARGEUR" subtitle={meta?.competition} />;

  const target = cur.weight ?? 0;
  const load = loadBar(target, state.bar);
  const countByPlate = new Map(load.perSide.map((p) => [p.weight, p.count]));
  const next = live.onDeck[0];

  return (
    <div className="screen chargeur">
      <div className="bar-name">
        {cur.athlete.lastName} {cur.athlete.firstName}
      </div>

      <div className="bar-row">
        <div>
          <div className="bar-label">Essai</div>
          <div className="bar-value">{cur.attemptNo}</div>
        </div>
        <div>
          <div className="bar-label">Hauteur</div>
          <div className="bar-value">—</div>
        </div>
        <div>
          <div className="bar-label">Rack</div>
          <div className="bar-value">—</div>
        </div>
      </div>

      <div className="plates">
        {DEFAULT_PLATES.map((p) => (
          <div className="plate-head" key={`h${p}`}>
            {p}
          </div>
        ))}
        {DEFAULT_PLATES.map((p) => {
          const count = countByPlate.get(p);
          const color = PLATE_COLORS[String(p)];
          return (
            <div
              className={`plate-count${count ? '' : ' empty'}`}
              key={`c${p}`}
              style={count && color ? { background: color.bg, color: color.fg } : undefined}
            >
              {count ?? ''}
            </div>
          );
        })}
      </div>

      <div className="bar-move">{LIFT_LABELS[cur.lift]}</div>
      <div className="bar-weight">{target} kg</div>

      <div className="next-band">Prochain passage</div>
      <div className="next-grid">
        <div className="h">Essai</div>
        <div className="h">Poids</div>
        <div className="h">Hauteur</div>
        <div className="h">Rack</div>
        <div className="h">Cales</div>
        <div className="v">{next ? next.attemptNo : '—'}</div>
        <div className="v">{next ? `${next.weight ?? '—'} kg` : '—'}</div>
        <div className="v">—</div>
        <div className="v">—</div>
        <div className="v">—</div>
      </div>
    </div>
  );
}
