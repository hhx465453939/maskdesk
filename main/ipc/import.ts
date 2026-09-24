import type { IpcMain } from 'electron';
import { BrowserWindow, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const KIND_BY_EXT: Record<string, 'docx' | 'pdf' | 'md' | 'txt'> = {
  '.docx': 'docx',
  '.pdf': 'pdf',
  '.md': 'md',
  '.markdown': 'md',
  '.txt': 'txt',
};

export function importsDir(sessionId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) throw new Error('E3001 非法会话标识');
  const dir = path.join(app.getPath('userData'), 'imports', sessionId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** 副本路径必须落在会话 imports 目录内（防路径逃逸读任意文件） */
function guardInside(dir: string, file: string): string {
  const resolved = path.resolve(file);
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) {
    throw new Error('E3002 非法文件路径');
  }
  return resolved;
}

export function registerImportIpc(ipcMain: IpcMain): void {
  // 系统文件选择器：选定即复制副本入会话目录
  ipcMain.handle('import:pick', async (e, sessionId: string) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '文档', extensions: ['docx', 'pdf', 'md', 'markdown', 'txt'] },
      ],
    });
    if (r.canceled) return [];
    const dir = importsDir(sessionId);
    const stamp = Date.now().toString(36);
    return r.filePaths.map((src, i) => {
      const ext = path.extname(src).toLowerCase();
      const kind = KIND_BY_EXT[ext];
      if (!kind) throw new Error(`E3003 不支持的格式: ${ext}`);
      const dest = path.join(dir, `${stamp}-${i}${ext}`);
      fs.copyFileSync(src, dest);
      return {
        name: path.basename(src),
        kind,
        size: fs.statSync(dest).size,
        rawPath: dest,
      };
    });
  });

  // 拖拽导入：renderer 传来字节，main 落副本
  ipcMain.handle(
    'import:stash',
    (e, sessionId: string, name: string, bytes: Uint8Array) => {
      const dir = importsDir(sessionId);
      const ext = path.extname(name).toLowerCase();
      const kind = KIND_BY_EXT[ext];
      if (!kind) throw new Error(`E3003 不支持的格式: ${ext || '(无扩展名)'}`);
      const dest = path.join(dir, `${Date.now().toString(36)}-${name.replace(/[^\w.\-一-龥]/g, '_')}`);
      fs.writeFileSync(dest, Buffer.from(bytes));
      return { name: path.basename(name), kind, size: bytes.byteLength, rawPath: dest };
    },
  );

  // renderer 读取副本字节（转换用）
  ipcMain.handle('import:read', (e, rawPath: string) => {
    const sessionId = path.basename(path.dirname(rawPath));
    const dir = importsDir(sessionId);
    return new Uint8Array(fs.readFileSync(guardInside(dir, rawPath)));
  });
}
