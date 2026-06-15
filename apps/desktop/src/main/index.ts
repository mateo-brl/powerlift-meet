import { join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import type { AppOptions, BarConfig, Override, ScreenName } from '../shared/types.js';
import { SCREEN_LABELS } from '../shared/types.js';
import { Store } from './store.js';

const store = new Store();
const screenWindows = new Map<ScreenName, BrowserWindow>();
let controlWindow: BrowserWindow | null = null;

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL'];

function loadRoute(win: BrowserWindow, hash: string): void {
  if (RENDERER_URL) {
    void win.loadURL(`${RENDERER_URL}#${hash}`);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), { hash });
  }
}

function broadcast(): void {
  const state = store.getState();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('state', state);
  }
}

function createControlWindow(): void {
  controlWindow = new BrowserWindow({
    width: 960,
    height: 680,
    title: 'powerlift-meet — Contrôle',
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  Menu.setApplicationMenu(null);
  loadRoute(controlWindow, 'control');
  controlWindow.on('closed', () => {
    controlWindow = null;
  });
}

function openScreen(name: ScreenName): void {
  const existing = screenWindows.get(name);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return;
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: `powerlift-meet — ${SCREEN_LABELS[name]}`,
    backgroundColor: '#0b1f3a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  loadRoute(win, name);
  screenWindows.set(name, win);
  store.setScreenOpen(name, true);
  win.on('closed', () => {
    screenWindows.delete(name);
    store.setScreenOpen(name, false);
  });
  // Plein écran sur F11, sortie sur Échap (pratique pour les vidéoprojecteurs).
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (input.type === 'keyDown' && input.key === 'Escape' && win.isFullScreen())
      win.setFullScreen(false);
  });
}

function registerIpc(): void {
  ipcMain.handle('getState', () => store.getState());

  ipcMain.handle('chooseFolder', async () => {
    const win = controlWindow ?? BrowserWindow.getFocusedWindow();
    const res = await dialog.showOpenDialog(win!, {
      title: 'Choisir le dossier des feuilles de match',
      properties: ['openDirectory'],
    });
    if (!res.canceled && res.filePaths[0]) await store.setFolder(res.filePaths[0]);
  });

  ipcMain.handle('setActivePlateau', (_e, id: string) => store.setActivePlateau(id));
  ipcMain.handle('openScreen', (_e, name: ScreenName) => openScreen(name));
  ipcMain.handle('closeScreen', (_e, name: ScreenName) => {
    const win = screenWindows.get(name);
    if (win && !win.isDestroyed()) win.close();
  });
  ipcMain.handle('setOverride', (_e, o: Override | null) => store.setOverride(o));
  ipcMain.handle('setOptions', (_e, o: Partial<AppOptions>) => store.setOptions(o));
  ipcMain.handle('setCompetitionType', (_e, t: string) => store.setCompetitionType(t));
  ipcMain.handle('setBar', (_e, b: Partial<BarConfig>) => store.setBar(b));
}

app.whenReady().then(() => {
  store.subscribe(() => broadcast());
  registerIpc();
  createControlWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  void store.dispose();
});
