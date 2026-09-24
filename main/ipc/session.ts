import type { IpcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { sessionsDir, readJson, writeJson } from '../lib/store';
import type { Session } from '../../shared/types';

/** 会话持久化 IPC（SPEC §4：session:save / session:list / session:load） */
export function registerSessionIpc(ipcMain: IpcMain): void {
  ipcMain.handle('session:save', (_e, session: Session) => {
    session.updatedAt = new Date().toISOString();
    writeJson(path.join(sessionsDir(), `${session.id}.json`), session);
    return { ok: true, updatedAt: session.updatedAt };
  });

  ipcMain.handle('session:list', () => {
    const dir = sessionsDir();
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const s = readJson<Session>(path.join(dir, f));
        return s ? { id: s.id, name: s.name, updatedAt: s.updatedAt } : null;
      })
      .filter((x): x is { id: string; name: string; updatedAt: string } => x !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  ipcMain.handle('session:load', (_e, id: string) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null; // 路径注入防护
    return readJson<Session>(path.join(sessionsDir(), `${id}.json`));
  });
}
