import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppOptions,
  AppState,
  BarConfig,
  DesktopApi,
  Override,
  ScreenName,
} from '../shared/types.js';

function currentScreen(): ScreenName | 'control' {
  const hash = location.hash.replace(/^#/, '');
  if (['feuille', 'joueur', 'chargeur', 'ordre'].includes(hash)) return hash as ScreenName;
  return 'control';
}

const api: DesktopApi = {
  getState: () => ipcRenderer.invoke('getState'),
  onState: (cb: (state: AppState) => void) => {
    const handler = (_e: unknown, state: AppState) => cb(state);
    ipcRenderer.on('state', handler);
    return () => ipcRenderer.removeListener('state', handler);
  },
  chooseFolder: () => ipcRenderer.invoke('chooseFolder'),
  setActivePlateau: (id: string) => ipcRenderer.invoke('setActivePlateau', id),
  openScreen: (name: ScreenName) => ipcRenderer.invoke('openScreen', name),
  closeScreen: (name: ScreenName) => ipcRenderer.invoke('closeScreen', name),
  setOverride: (o: Override | null) => ipcRenderer.invoke('setOverride', o),
  setOptions: (o: Partial<AppOptions>) => ipcRenderer.invoke('setOptions', o),
  setCompetitionType: (t: string) => ipcRenderer.invoke('setCompetitionType', t),
  setBar: (b: Partial<BarConfig>) => ipcRenderer.invoke('setBar', b),
  screen: currentScreen(),
};

contextBridge.exposeInMainWorld('api', api);
