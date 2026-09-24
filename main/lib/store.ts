import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/** userData/sessions/ 目录保障与 JSON 读写（SPEC ADR-2：userData JSON 持久化） */
export function sessionsDir(): string {
  const dir = path.join(app.getPath('userData'), 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function writeJson(file: string, data: unknown): void {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, file); // 原子替换，防写一半损坏
}
