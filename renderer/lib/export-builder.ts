import JSZip from 'jszip';
import { applyRules } from './rules-engine';
import type { Mapping, Session } from './types';

export interface PiiHit {
  label: string;
  sample: string;
}

/** 高风险 PII 特征族（沿 family_health 强门禁语义；决定权还给用户——确认后可导出） */
const PII_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: '手机号', regex: /\b1[3-9]\d{9}\b/g },
  { label: '身份证号', regex: /\b\d{17}[\dXx]\b/g },
  { label: '银行卡号', regex: /\b\d{13,19}\b/g },
];

/** 导出前扫描脱敏视图：命中则提示用户确认 */
export function scanPii(sanitizedTexts: string[]): PiiHit[] {
  const hits: PiiHit[] = [];
  const seen = new Set<string>();
  for (const text of sanitizedTexts) {
    for (const { label, regex } of PII_PATTERNS) {
      for (const m of text.matchAll(regex)) {
        const sample = m[0];
        const key = `${label}:${sample}`;
        if (!seen.has(key)) {
          seen.add(key);
          hits.push({ label, sample: sample.slice(0, 6) + '***' });
        }
      }
    }
  }
  return hits;
}

export interface ExportInput {
  session: Session;
  appVersion: string;
  /** docId → 原始文件字节 */
  rawBytes: Map<string, Uint8Array>;
}

/** 导出包构建（FR-5）：manifest + rules + raw/ + markdown/ + sanitized/ 五件套 */
export async function buildZip(input: ExportInput): Promise<Uint8Array> {
  const { session, appVersion, rawBytes } = input;
  const zip = new JSZip();
  const exportedAt = new Date().toISOString();
  const allMappings: Mapping[] = [];
  const docStats: { name: string; status: string; hits: number }[] = [];

  for (const doc of session.docs) {
    if (doc.status !== 'ready' || !doc.originalMarkdown) continue;
    const applied = applyRules(doc.originalMarkdown, session.rules);
    const sanitized = applied.segments.map((s) => s.text).join('');
    const slug = doc.name.replace(/\.[^.]+$/, '').replace(/[^\w.\-一-龥]/g, '_');

    zip.file(`markdown/${slug}.md`, doc.originalMarkdown);
    zip.file(`sanitized/${slug}.md`, sanitized);
    const bytes = rawBytes.get(doc.id);
    if (bytes && doc.rawPath) {
      const ext = doc.rawPath.slice(doc.rawPath.lastIndexOf('.'));
      zip.file(`raw/${slug}${ext}`, bytes);
    }
    docStats.push({ name: doc.name, status: doc.status, hits: applied.totalHits });
    allMappings.push(...applied.mappings.map((m) => ({ ...m, docId: doc.id })));
  }

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        app: 'maskdesk',
        version: appVersion,
        exportedAt,
        session: { id: session.id, name: session.name },
        docs: docStats,
        rulesCount: session.rules.length,
        mappingsCount: allMappings.length,
      },
      null,
      2,
    ),
  );
  zip.file(
    'rules.json',
    JSON.stringify({ version: 1, exportedAt, rules: session.rules, mappings: allMappings }, null, 2),
  );

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
