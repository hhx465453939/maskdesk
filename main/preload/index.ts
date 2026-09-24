import { contextBridge, ipcRenderer } from 'electron';
import type { Session, SessionIndexItem, AppInfo } from '../../shared/types';

/**
 * contextBridge 白名单 API（SPEC Security：contextIsolation + 无 nodeIntegration）
 * renderer 侧通过 window.maskdesk.* 调用，零网络、零 Node 暴露
 */
const api = {
  saveSession: (session: Session): Promise<{ ok: boolean; updatedAt: string }> =>
    ipcRenderer.invoke('session:save', session),
  listSessions: (): Promise<SessionIndexItem[]> => ipcRenderer.invoke('session:list'),
  loadSession: (id: string): Promise<Session | null> => ipcRenderer.invoke('session:load', id),
  appInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:version'),
};

export type MaskdeskApi = typeof api;

contextBridge.exposeInMainWorld('maskdesk', api);
