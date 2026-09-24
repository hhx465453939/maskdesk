/**
 * M2 转换管线 node 级冒烟：node/scripts 下直接跑（真文档样例）
 * 用法：cd renderer && npx tsx scripts/smoke-convert.ts <sampleDir>
 * 覆盖：DOCX→MD、PDF 文本层→MD、MD 直读、扫描件检测（纯图 PDF 触发 E1002）
 */
import * as fs from 'fs';
import * as path from 'path';
import { convertDocument, ConvertError } from '../lib/convert';

const dir = process.argv[2];
if (!dir) {
  console.error('用法: npx tsx scripts/smoke-convert.ts <sampleDir>');
  process.exit(1);
}

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
  // 1. DOCX → Markdown
  const docx = await convertDocument('docx', new Uint8Array(fs.readFileSync(path.join(dir, 'sample.docx'))), 'sample.docx');
  check('DOCX 含标题文本', docx.markdown.includes('张三的出院记录'), docx.markdown.slice(0, 120));
  check('DOCX 含正文与电话', docx.markdown.includes('13800138000'), docx.markdown.slice(0, 200));

  // 2. PDF 文本层 → Markdown
  const pdf = await convertDocument('pdf', new Uint8Array(fs.readFileSync(path.join(dir, 'sample.pdf'))), 'sample.pdf');
  check('PDF 含页标题', /## 第 1 页/.test(pdf.markdown), pdf.markdown.slice(0, 120));
  check('PDF 含文本内容', pdf.markdown.includes('Zhang San'), pdf.markdown.slice(0, 200));

  // 3. Markdown 直读
  const md = await convertDocument('md', new Uint8Array(fs.readFileSync(path.join(dir, 'sample.md'))), 'sample.md');
  check('MD 原样保留', md.markdown.includes('住院号 1234567'), md.markdown);

  // 4. 扫描件检测：空文本 PDF（无内容流文本）应触发 E1002
  const emptyPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\ntrailer\n<< /Size 4 /Root 1 0 R >>\n%%EOF',
    'utf-8',
  );
  try {
    await convertDocument('pdf', new Uint8Array(emptyPdf), 'scan.pdf');
    check('扫描件检测', false, '未抛出 E1002');
  } catch (err) {
    check('扫描件检测', err instanceof ConvertError && err.code === 'E1002', String((err as Error).message));
  }

  console.log(`\n冒烟结果: ${pass} 通过 / ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
}

void main();
