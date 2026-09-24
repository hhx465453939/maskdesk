import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerSessionIpc } from './ipc/session';
import { registerAppIpc } from './ipc/app';
import { registerImportIpc } from './ipc/import';
import { registerRulesIpc } from './ipc/rules';
import { registerExportIpc } from './ipc/export';

const isDev = process.env.NODE_ENV === 'development';

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    title: 'maskdesk',
    backgroundColor: '#f7f8fa',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 零网络约束（SPEC Security）：生产模式注入 CSP 禁一切外联；dev 需放行 HMR websocket
  if (!isDev) {
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' file: data: blob:; script-src 'self' file: 'unsafe-inline'; style-src 'self' file: 'unsafe-inline'; img-src 'self' file: data: blob:; connect-src 'none'",
          ],
        },
      });
    });
  }

  if (isDev && process.env.RENDERER_URL) {
    win.loadURL(process.env.RENDERER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../../renderer/out/index.html'));
  }
  return win;
}

app.whenReady().then(() => {
  registerSessionIpc(ipcMain);
  registerAppIpc(ipcMain);
  registerImportIpc(ipcMain);
  registerRulesIpc(ipcMain);
  registerExportIpc(ipcMain);
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
