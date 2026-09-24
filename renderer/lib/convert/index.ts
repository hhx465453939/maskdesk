import type { DocKind } from '../types';
import { convertDocx } from './docx';
import { convertPdf } from './pdf';
import { convertPlaintext } from './plaintext';

export interface ConvertResult {
  markdown: string;
  /** 扫描件等"无文本层"的明确信号（PRD A2：给用户明确提示） */
  warning?: string;
}

/** 结构化错误：E1xxx 转换域（SPEC Observability） */
export class ConvertError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function convertDocument(kind: DocKind, bytes: Uint8Array, name: string): Promise<ConvertResult> {
  switch (kind) {
    case 'docx':
      return convertDocx(bytes);
    case 'pdf':
      return convertPdf(bytes, name);
    case 'md':
    case 'txt':
      return convertPlaintext(bytes);
    default:
      throw new ConvertError('E1004', `未知文档类型: ${kind}`);
  }
}
