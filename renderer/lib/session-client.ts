import type { AppInfo, Session, SessionIndexItem } from './types';
import type { ImportedFileMeta } from '../../main/preload/index';

/** preload 白名单 API 的类型化封装（renderer 唯一的主进程入口） */
export interface MaskdeskBridge {
  saveSession(s: Session): Promise<{ ok: boolean; updatedAt: string }>;
  listSessions(): Promise<SessionIndexItem[]>;
  loadSession(id: string): Promise<Session | null>;
  appInfo(): Promise<AppInfo>;
  pickFiles(sessionId: string): Promise<ImportedFileMeta[]>;
  stashFile(sessionId: string, name: string, bytes: Uint8Array): Promise<ImportedFileMeta>;
  readRaw(rawPath: string): Promise<Uint8Array>;
}

declare global {
  interface Window {
    maskdesk: MaskdeskBridge;
  }
}

export const bridge = (): MaskdeskBridge => window.maskdesk;

export function newSession(name: string): Session {
  const now = new Date().toISOString();
  return {
    id: `s-${Date.now().toString(36)}`,
    name,
    docs: [],
    rules: [],
    mappings: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}
