import { basename } from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { readPlateauFile } from '@powerlift-meet/xlsx-reader';
import type {
  AppOptions,
  AppState,
  BarConfig,
  Override,
  PlateauData,
  PlateauInfo,
  ScreenName,
} from '../shared/types.js';

interface LoadedPlateau {
  info: PlateauInfo;
  data: PlateauData;
  mtimeMs: number;
  loadedAt: number;
}

/** Dérive un identifiant et un libellé lisible depuis le nom de fichier. */
function plateauIdentity(file: string): { id: string; label: string } {
  const name = basename(file).replace(/\.xls[mx]$/i, '');
  const id = name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return { id, label: name };
}

/**
 * État central du process principal : surveille un dossier de feuilles de match, lit les
 * `.xlsm` (lecture seule) et notifie les abonnés à chaque changement.
 */
export class Store {
  private folder: string | null = null;
  private plateaux = new Map<string, LoadedPlateau>();
  private activePlateauId: string | null = null;
  private override: Override | null = null;
  private competitionType = 'FA/PL Clas. par Cat.';
  private options: AppOptions = { finalesOpen: false, chargerRecords: false, genererVmix: false };
  private bar: BarConfig = { barWeight: 20, collarWeight: 2.5 };
  private openScreens: Record<ScreenName, boolean> = {
    feuille: false,
    joueur: false,
    chargeur: false,
    ordre: false,
  };
  private error: string | null = null;
  private watcher: FSWatcher | null = null;
  private listeners = new Set<(s: AppState) => void>();

  subscribe(cb: (s: AppState) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    const state = this.getState();
    for (const cb of this.listeners) cb(state);
  }

  getState(): AppState {
    const now = Date.now();
    const plateaux = [...this.plateaux.values()]
      .map((p) => ({ ...p.info, freshSeconds: (now - p.loadedAt) / 1000 }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const active = this.activePlateauId
      ? (this.plateaux.get(this.activePlateauId)?.data ?? null)
      : null;
    return {
      folder: this.folder,
      plateaux,
      activePlateauId: this.activePlateauId,
      active,
      override: this.override,
      competitionType: this.competitionType,
      options: this.options,
      bar: this.bar,
      openScreens: { ...this.openScreens },
      error: this.error,
    };
  }

  async setFolder(folder: string): Promise<void> {
    this.folder = folder;
    this.plateaux.clear();
    this.activePlateauId = null;
    this.error = null;
    await this.watcher?.close();

    await this.scanAll();

    this.watcher = chokidar.watch(folder, {
      depth: 0,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
    });
    const onChange = (path: string) => {
      if (/\.xls[mx]$/i.test(path) && !/~\$|\.~lock/.test(path)) void this.reloadFile(path);
    };
    this.watcher
      .on('add', onChange)
      .on('change', onChange)
      .on('unlink', (p) => this.removeFile(p));
    this.emit();
  }

  private async scanAll(): Promise<void> {
    if (!this.folder) return;
    let files: string[] = [];
    try {
      files = (await readdir(this.folder))
        .filter((f) => /\.xls[mx]$/i.test(f) && !/^~\$|\.~lock/.test(f))
        .map((f) => join(this.folder!, f));
    } catch (e) {
      this.error = `Dossier illisible : ${(e as Error).message}`;
      return;
    }
    await Promise.all(files.map((f) => this.reloadFile(f, false)));
    if (!this.activePlateauId) {
      const first = [...this.plateaux.values()].sort((a, b) =>
        a.info.label.localeCompare(b.info.label),
      )[0];
      this.activePlateauId = first?.info.id ?? null;
    }
  }

  private async reloadFile(file: string, emit = true): Promise<void> {
    try {
      const st = await stat(file);
      const { id, label } = plateauIdentity(file);
      const existing = this.plateaux.get(id);
      if (existing && existing.mtimeMs === st.mtimeMs) return; // inchangé
      const plateau = await readPlateauFile(file);
      const data: PlateauData = { id, meta: plateau.meta, athletes: plateau.athletes };
      const info: PlateauInfo = {
        id,
        label,
        file,
        discipline: plateau.athletes[0]?.discipline ?? 'FA',
        nAthletes: plateau.athletes.length,
        freshSeconds: 0,
      };
      this.plateaux.set(id, { info, data, mtimeMs: st.mtimeMs, loadedAt: Date.now() });
      this.error = null;
    } catch (e) {
      this.error = `Lecture de ${basename(file)} : ${(e as Error).message}`;
    }
    if (emit) this.emit();
  }

  private removeFile(file: string): void {
    const { id } = plateauIdentity(file);
    this.plateaux.delete(id);
    if (this.activePlateauId === id) this.activePlateauId = null;
    this.emit();
  }

  setActivePlateau(id: string): void {
    if (this.plateaux.has(id)) {
      this.activePlateauId = id;
      this.override = null;
      this.emit();
    }
  }

  setOverride(o: Override | null): void {
    this.override = o;
    this.emit();
  }

  setOptions(o: Partial<AppOptions>): void {
    this.options = { ...this.options, ...o };
    this.emit();
  }

  setCompetitionType(t: string): void {
    this.competitionType = t;
    this.emit();
  }

  setBar(b: Partial<BarConfig>): void {
    this.bar = { ...this.bar, ...b };
    this.emit();
  }

  setScreenOpen(name: ScreenName, open: boolean): void {
    this.openScreens[name] = open;
    this.emit();
  }

  async dispose(): Promise<void> {
    await this.watcher?.close();
    this.listeners.clear();
  }
}
