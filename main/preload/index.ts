import { contextBridge, ipcRenderer } from 'electron';
import type { Session, SessionIndexItem, AppInfo } from '../../shared/types';

export interface ImportedFileMeta {
  name: string;
  kind: 'docx' | 'pdf' | 'md' | 'txt';
  size: number;
  rawPath: string;
}

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
  /** 系统文件选择器导入（选定即复制副本） */
  pickFiles: (sessionId: string): Promise<ImportedFileMeta[]> =>
    ipcRenderer.invoke('import:pick', sessionId),
  /** 拖拽导入：字节落副本 */
  stashFile: (sessionId: string, name: string, bytes: Uint8Array): Promise<ImportedFileMeta> =>
    ipcRenderer.invoke('import:stash', sessionId, name, bytes),
  /** 读取副本字节（转换用） */
  readRaw: (rawPath: string): Promise<Uint8Array> => ipcRenderer.invoke('import:read', rawPath),
  /** 规则库导出（用户选路径写 JSON） */
  exportRules: (json: string): Promise<{ ok: boolean; path?: string }> =>
    ipcRenderer.invoke('rules:export', json),
  /** 规则库导入（用户选文件读 JSON） */
  importRules: (): Promise<{ ok: boolean; json?: string }> =>
    ipcRenderer.invoke('rules:import'),
  /** 导出 ZIP 落盘（用户选路径，原子写） */
  saveExport: (defaultName: string, bytes: Uint8Array): Promise<{ ok: boolean; path?: string }> =>
    ipcRenderer.invoke('export:save', defaultName, bytes),
};

export type MaskdeskApi = typeof api;

contextBridge.exposeInMainWorld('maskdesk', api);
