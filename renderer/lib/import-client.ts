import { bridge } from './session-client';
import { convertDocument, ConvertError } from './convert';
import type { DocItem, Session } from './types';

const KIND_RE = /\.(docx|pdf|md|markdown|txt)$/i;

export function isImportableName(name: string): boolean {
  return KIND_RE.test(name);
}

function kindOf(name: string): DocItem['kind'] {
  const ext = name.toLowerCase().match(KIND_RE)?.[1] ?? '';
  if (ext === 'docx') return 'docx';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return 'txt';
}

function newId(): string {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 单文档流水：pending → converting → (副本落盘) → 转换 → ready | failed
 * bytes 为转换输入；meta 提供 rawPath（拖拽场景先 stash 落副本）
 */
async function processOne(
  session: Session,
  name: string,
  bytes: Uint8Array,
  rawPath: string | undefined,
  onDoc: (doc: DocItem) => void,
): Promise<void> {
  const doc: DocItem = {
    id: newId(),
    name,
    kind: kindOf(name),
    size: bytes.byteLength,
    status: 'converting',
    rawPath,
  };
  onDoc(doc);
  try {
    let path = doc.rawPath;
    if (!path) path = (await bridge().stashFile(session.id, name, bytes)).rawPath;
    const { markdown, warning } = await convertDocument(doc.kind, bytes, name);
    onDoc({ ...doc, status: 'ready', rawPath: path, originalMarkdown: markdown, error: warning });
  } catch (err) {
    onDoc({
      ...doc,
      status: 'failed',
      error: err instanceof ConvertError ? `${err.code} ${err.message}` : (err as Error).message,
    });
  }
}

/** 拖拽导入：renderer 持有 File 字节，转换与副本共用同一份 */
export async function importViaDrop(
  session: Session,
  files: File[],
  onDoc: (doc: DocItem) => void,
): Promise<void> {
  for (const f of files) {
    if (!isImportableName(f.name)) {
      onDoc({
        id: newId(),
        name: f.name,
        kind: 'txt',
        size: f.size,
        status: 'failed',
        error: 'E3003 不支持的格式（支持 DOCX / PDF / Markdown / TXT）',
      });
      continue;
    }
    await processOne(session, f.name, new Uint8Array(await f.arrayBuffer()), undefined, onDoc);
  }
}

/** 系统文件选择器导入：main 已复制副本，renderer 读回字节转换 */
export async function importViaPicker(
  session: Session,
  onDoc: (doc: DocItem) => void,
): Promise<void> {
  const metas = await bridge().pickFiles(session.id);
  for (const m of metas) {
    const bytes = await bridge().readRaw(m.rawPath);
    await processOne(session, m.name, bytes, m.rawPath, onDoc);
  }
}
