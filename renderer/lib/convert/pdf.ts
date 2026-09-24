import * as pdfjs from 'pdfjs-dist';
import { ConvertError, type ConvertResult } from './index';


// 静态导出 + file:// 环境：worker 由 webpack 以资产形式带出（next build 产物同源可加载）
// 静态导出 + file:// 离线环境：worker 随 public/ 复制到导出根，相对页面路径加载
pdfjs.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs';

/** 每页平均字符数低于该阈值判定为扫描图片型 PDF（无文本层） */
const SCAN_THRESHOLD_CHARS_PER_PAGE = 20;

/** PDF → Markdown：逐页文本层抽取，段落合并 + 页标题标记 */
export async function convertPdf(bytes: Uint8Array, name: string): Promise<ConvertResult> {
  try {
    const task = pdfjs.getDocument({ data: bytes });
    const doc = await task.promise;
    const parts: string[] = [];
    let totalChars = 0;

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      // 按 y 坐标分行、行内按 x 排序拼段（保留阅读顺序）
      const lines = new Map<number, { x: number; s: string }[]>();
      for (const item of content.items as { str: string; transform: number[] }[]) {
        if (!item.str) continue;
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];
        const arr = lines.get(y) ?? [];
        arr.push({ x, s: item.str });
        lines.set(y, arr);
      }
      const pageText = [...lines.entries()]
        .sort((a, b) => b[0] - a[0]) // PDF y 轴向上
        .map(([, segs]) => segs.sort((m, n) => m.x - n.x).map((s) => s.s).join(' ').trim())
        .filter(Boolean)
        .join('\n\n');
      totalChars += pageText.length;
      parts.push(`## 第 ${p} 页\n\n${pageText}`);
      page.cleanup();
    }
    await task.destroy();

    if (totalChars / doc.numPages < SCAN_THRESHOLD_CHARS_PER_PAGE) {
      throw new ConvertError(
        'E1002',
        `${name} 是扫描图片型 PDF（无文本层），本工具暂不支持 OCR——请先使用 OCR 工具转出文本`,
      );
    }
    return { markdown: `# ${name.replace(/\.pdf$/i, '')}\n\n${parts.join('\n\n')}` };
  } catch (err) {
    if (err instanceof ConvertError) throw err;
    throw new ConvertError('E1003', `PDF 转换失败：${(err as Error).message}`);
  }
}
