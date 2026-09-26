import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { ConvertError, type ConvertResult } from './index';

/** DOCX → HTML(mammoth) → Markdown(turndown)，表格保留为 GFM */
export async function convertDocx(bytes: Uint8Array): Promise<ConvertResult> {
  try {
    const { value: html } = await mammoth.convertToHtml(
      // 运行时为 mammoth browser build：openZip 只认 arrayBuffer 键（buffer 键仅 node 入口支持），
      // 传 buffer 键会报 "Could not find file in options"。Uint8Array 视图须转成完整 ArrayBuffer。
      {
        arrayBuffer: bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer,
      },
      { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Heading 1'] => h1:fresh"] },
    );
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });
    const markdown = turndown.turndown(html).trim();
    return { markdown };
  } catch (err) {
    throw new ConvertError('E1001', `DOCX 转换失败：${(err as Error).message}`);
  }
}
