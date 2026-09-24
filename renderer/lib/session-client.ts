import type { AppInfo, Session, SessionIndexItem } from './types';

/** preload 白名单 API 的类型化封装（renderer 唯一的主进程入口） */
export interface MaskdeskBridge {
  saveSession(s: Session): Promise<{ ok: boolean; updatedAt: string }>;
  listSessions(): Promise<SessionIndexItem[]>;
  loadSession(id: string): Promise<Session | null>;
  appInfo(): Promise<AppInfo>;
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
