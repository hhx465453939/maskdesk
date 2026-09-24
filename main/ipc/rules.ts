import type { IpcMain } from 'electron';
import { BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';

/** 规则库导入导出（JSON 文件，用户选择路径） */
export function registerRulesIpc(ipcMain: IpcMain): void {
  ipcMain.handle('rules:export', async (e, json: string) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showSaveDialog(win!, {
      defaultPath: 'maskdesk-rules.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (r.canceled || !r.filePath) return { ok: false };
    fs.writeFileSync(r.filePath, json, 'utf-8');
    return { ok: true, path: r.filePath };
  });

  ipcMain.handle('rules:import', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (r.canceled || r.filePaths.length === 0) return { ok: false };
    try {
      return { ok: true, json: fs.readFileSync(r.filePaths[0], 'utf-8') };
    } catch (err) {
      throw new Error(`E3010 规则文件读取失败：${(err as Error).message}`);
    }
  });
}
