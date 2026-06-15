import { LIFT_LABELS, type LiftKey } from '@powerlift-meet/core';
import { api, useAppState } from '../api.js';
import { useComputed } from '../live.js';
import {
  COMPETITION_TYPES,
  SCREENS,
  SCREEN_LABELS,
  type ScreenName,
} from '../../../shared/types.js';
import '../styles/control.css';

function freshClass(s: number): string {
  if (s < 20) return 'ok';
  if (s < 120) return 'warn';
  return 'old';
}

export function Control(): JSX.Element {
  const state = useAppState();
  const { live, athletes } = useComputed(state);

  return (
    <div className="control">
      <h1>
        powerlift-meet <span className="tag">FFForce</span>
      </h1>

      {state.error && <div className="error">⚠️ {state.error}</div>}

      <section>
        <h2>Fichier de référence</h2>
        <div className="row">
          <div className="field" title={state.folder ?? ''}>
            {state.folder ?? 'Aucun dossier sélectionné'}
          </div>
          <button className="btn" onClick={() => api.chooseFolder()}>
            …
          </button>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <select
            className="field"
            value={state.competitionType}
            onChange={(e) => api.setCompetitionType(e.target.value)}
          >
            {COMPETITION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="checks">
            <label>
              <input
                type="checkbox"
                checked={state.options.finalesOpen}
                onChange={(e) => api.setOptions({ finalesOpen: e.target.checked })}
              />
              Finales Open
            </label>
            <label>
              <input
                type="checkbox"
                checked={state.options.chargerRecords}
                onChange={(e) => api.setOptions({ chargerRecords: e.target.checked })}
              />
              Charger les records
            </label>
            <label title="Disponible en phase 2" style={{ opacity: 0.5 }}>
              <input
                type="checkbox"
                disabled
                checked={state.options.genererVmix}
                onChange={(e) => api.setOptions({ genererVmix: e.target.checked })}
              />
              Générer le fichier VMIX
            </label>
          </div>
        </div>
      </section>

      <section>
        <h2>Plateau à l'antenne</h2>
        {state.plateaux.length === 0 ? (
          <div className="muted">
            Sélectionnez un dossier contenant des feuilles de match (.xlsm).
          </div>
        ) : (
          <div className="plateaux">
            {state.plateaux.map((p) => (
              <button
                key={p.id}
                className={`btn plateau${p.id === state.activePlateauId ? ' active' : ''}`}
                onClick={() => api.setActivePlateau(p.id)}
              >
                <span className="name">{p.label}</span>
                <span className="meta">
                  <span className={`fresh ${freshClass(p.freshSeconds)}`} />
                  {p.discipline} · {p.nAthletes} athlètes
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Écrans de salle</h2>
        <div className="displays">
          {SCREENS.map((name) => (
            <DisplayButton key={name} name={name} open={state.openScreens[name]} />
          ))}
        </div>
      </section>

      <section>
        <h2>Passage en cours</h2>
        <div className="live-now">
          {live.current ? (
            <>
              <b>
                {live.current.athlete.lastName} {live.current.athlete.firstName}
              </b>{' '}
              — {LIFT_LABELS[live.current.lift]} · essai {live.current.attemptNo} ·{' '}
              {live.current.weight ?? '—'} kg
              {state.override && ' (forcé)'}
            </>
          ) : (
            <span className="muted">Aucun passage détecté (lecture automatique).</span>
          )}
        </div>
        <OverrideRow athletes={athletes} active={!!state.override} />
      </section>

      <section>
        <h2>Chargeur — matériel</h2>
        <div className="row">
          <label className="muted">
            Barre (kg){' '}
            <input
              className="field"
              type="number"
              step="0.5"
              style={{ width: 90, flex: 'none' }}
              value={state.bar.barWeight}
              onChange={(e) => api.setBar({ barWeight: Number(e.target.value) })}
            />
          </label>
          <label className="muted">
            Collier / côté (kg){' '}
            <input
              className="field"
              type="number"
              step="0.25"
              style={{ width: 90, flex: 'none' }}
              value={state.bar.collarWeight}
              onChange={(e) => api.setBar({ collarWeight: Number(e.target.value) })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

function DisplayButton({ name, open }: { name: ScreenName; open: boolean }): JSX.Element {
  return (
    <button
      className={`btn red${open ? '' : ' off'}`}
      onClick={() => (open ? api.closeScreen(name) : api.openScreen(name))}
    >
      AFFICHER {SCREEN_LABELS[name].toUpperCase()}
      <small>{open ? 'fenêtre ouverte — cliquer pour fermer' : 'ouvrir la fenêtre'}</small>
    </button>
  );
}

function OverrideRow({
  athletes,
  active,
}: {
  athletes: ReturnType<typeof useComputed>['athletes'];
  active: boolean;
}): JSX.Element {
  const lifts: LiftKey[] = ['squat', 'bench', 'deadlift'];
  let row = athletes[0]?.row ?? 0;
  let lift: LiftKey = 'squat';
  let attemptNo = 1;
  let weight = '';

  const apply = () => {
    const a = athletes.find((x) => x.row === Number(row));
    if (!a) return;
    api.setOverride({
      row: Number(row),
      lift,
      attemptNo: Number(attemptNo),
      weight: weight === '' ? null : Number(weight),
    });
  };

  return (
    <div className="override-grid" style={{ marginTop: 12 }}>
      <select className="field" defaultValue={row} onChange={(e) => (row = Number(e.target.value))}>
        {athletes.map((a) => (
          <option key={a.row} value={a.row}>
            {a.lastName} {a.firstName}
          </option>
        ))}
      </select>
      <select
        className="field"
        defaultValue={lift}
        onChange={(e) => (lift = e.target.value as LiftKey)}
      >
        {lifts.map((l) => (
          <option key={l} value={l}>
            {LIFT_LABELS[l]}
          </option>
        ))}
      </select>
      <select
        className="field"
        defaultValue={attemptNo}
        onChange={(e) => (attemptNo = Number(e.target.value))}
      >
        {[1, 2, 3].map((n) => (
          <option key={n} value={n}>
            Essai {n}
          </option>
        ))}
      </select>
      <input className="field" placeholder="charge" onChange={(e) => (weight = e.target.value)} />
      <div className="row">
        <button className="btn" onClick={apply}>
          Forcer
        </button>
        {active && (
          <button className="btn" onClick={() => api.setOverride(null)}>
            ↺ Auto
          </button>
        )}
      </div>
    </div>
  );
}
