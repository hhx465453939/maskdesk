import type { ConvertResult } from './index';

/** MD / TXT：直读文本，原样即 Markdown */
export async function convertPlaintext(bytes: Uint8Array): Promise<ConvertResult> {
  return { markdown: new TextDecoder('utf-8').decode(bytes).trim() };
}
