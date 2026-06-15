import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// On garde les modules natifs de Node externes, mais on BUNDLE les dépendances applicatives
// (exceljs, chokidar, @powerlift-meet/*) dans le process principal : `dist-electron` est ainsi
// autonome et electron-builder n'a aucun node_modules à résoudre (robuste en monorepo hoisté).
const BUNDLED = ['@powerlift-meet/core', '@powerlift-meet/xlsx-reader', 'exceljs', 'chokidar'];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: BUNDLED })],
    build: {
      outDir: 'dist-electron/main',
      lib: { entry: resolve(__dirname, 'src/main/index.ts') },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
      lib: { entry: resolve(__dirname, 'src/preload/index.ts') },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    build: {
      outDir: 'dist-electron/renderer',
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
});
