import type { IpcMain } from 'electron';
import { BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';

/** 导出 ZIP 落盘：用户选路径 + 原子写（ADR-4：主进程 dialog + fs，不走浏览器下载流） */
export function registerExportIpc(ipcMain: IpcMain): void {
  ipcMain.handle(
    'export:save',
    async (e, defaultName: string, bytes: Uint8Array) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      const r = await dialog.showSaveDialog(win!, {
        defaultPath: defaultName,
        filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }],
      });
      if (r.canceled || !r.filePath) return { ok: false };
      const tmp = `${r.filePath}.tmp`;
      fs.writeFileSync(tmp, Buffer.from(bytes));
      fs.renameSync(tmp, r.filePath);
      return { ok: true, path: r.filePath };
    },
  );
}
