import { app, type IpcMain } from 'electron';

/** 应用信息 IPC（SPEC §4：app:version） */
export function registerAppIpc(ipcMain: IpcMain): void {
  ipcMain.handle('app:version', () => ({
    version: app.getVersion(),
    productName: 'maskdesk',
  }));
}
