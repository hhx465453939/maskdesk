/**
 * M5 导出包冒烟：npx tsx scripts/smoke-export.ts
 * 覆盖：ZIP 五件套结构 / sanitized 无原文残留 / rules.json 映射可追溯 / PII 门禁命中
 */
import * as fs from 'fs';
import JSZip from 'jszip';
import { buildZip, scanPii } from '../lib/export-builder';
import type { Session } from '../lib/types';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}\n    ${detail}`);
  }
}

async function main(): Promise<void> {
  const session: Session = {
    id: 's-test',
    name: '测试项目',
    docs: [
      {
        id: 'd1',
        name: '出院记录.docx',
        kind: 'docx',
        size: 100,
        status: 'ready',
        rawPath: '/imports/s-test/出院记录.docx',
        originalMarkdown: '# 出院记录\n\n患者张三，住院号 1234567，电话 13800138000。\n',
      },
    ],
    rules: [
      {
        id: 'r1',
        tag: '姓名',
        ruleType: 'literal',
        pattern: '张三',
        replacementToken: '[姓名_1]',
        enabled: true,
        createdAt: '',
      },
    ],
    mappings: [],
    version: 1,
    createdAt: '',
    updatedAt: '',
  };

  const rawBytes = new Map<string, Uint8Array>([['d1', new Uint8Array([1, 2, 3])]]);
  const bytes = await buildZip({ session, appVersion: '0.1.0-test', rawBytes });

  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);

  check('五件套齐全', ['manifest.json', 'rules.json', 'raw/出院记录.docx', 'markdown/出院记录.md', 'sanitized/出院记录.md'].every((n) => names.includes(n)), names.join(', '));

  const sanitized = await zip.file('sanitized/出院记录.md')!.async('string');
  check('sanitized 无原文残留', !sanitized.includes('张三'), sanitized);

  const rulesJson = JSON.parse(await zip.file('rules.json')!.async('string'));
  check(
    '映射可追溯',
    rulesJson.mappings?.[0]?.docId === 'd1' && rulesJson.mappings?.[0]?.count === 1 && rulesJson.rules?.length === 1,
    JSON.stringify(rulesJson.mappings),
  );

  const manifest = JSON.parse(await zip.file('manifest.json')!.async('string'));
  check('manifest 统计正确', manifest.docs[0].hits === 1 && manifest.rulesCount === 1, JSON.stringify(manifest.docs));

  // PII 门禁：电话未脱敏应命中
  const hits = scanPii(['电话 13912345678 未处理']);
  check('PII 门禁命中', hits.length === 1 && hits[0].label === '手机号', JSON.stringify(hits));

  console.log(`\n导出冒烟: ${pass} 通过 / ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
}

void main();
