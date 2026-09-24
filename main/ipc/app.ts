import type { IpcMain } from 'electron';

/** 应用信息 IPC（SPEC §4：app:version） */
export function registerAppIpc(ipcMain: IpcMain): void {
  ipcMain.handle('app:version', () => ({
    version: '0.1.0',
    productName: 'maskdesk',
  }));
}
