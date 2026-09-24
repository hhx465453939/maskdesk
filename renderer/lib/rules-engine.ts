import type { Mapping, Rule } from './types';

/** 渲染段：原文切片，masked 段的 text 即占位符 */
export interface Segment {
  text: string;
  masked: boolean;
  ruleId?: string;
}

export interface ApplyResult {
  segments: Segment[];
  mappings: Mapping[];
  totalHits: number;
}

interface Piece extends Segment {}

/**
 * ADR-5 视图纯函数：脱敏视图 = f(原文, 启用规则)。
 * 语义（唯一权威定义）：
 *  1. 规则按创建顺序依次应用；
 *  2. 每条规则在「当前视图全文」上匹配，但只有落在**未遮蔽区间**的命中被替换；
 *  3. 每处命中独立替换为该规则的 replacementToken；
 *  4. 同规则多处命中合并为一条 Mapping（count 聚合）。
 */
export function applyRules(original: string, rules: Rule[]): ApplyResult {
  let pieces: Piece[] = [{ text: original, masked: false }];
  const mappings = new Map<string, Mapping>();

  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern) continue;

    // 1) 在当前全文上收集命中区间
    const flat = pieces.map((p) => p.text).join('');
    const ranges: [number, number][] = [];

    if (rule.ruleType === 'literal') {
      let from = 0;
      for (;;) {
        const idx = flat.indexOf(rule.pattern, from);
        if (idx < 0) break;
        ranges.push([idx, idx + rule.pattern.length]);
        from = idx + rule.pattern.length;
      }
    } else {
      try {
        const re = new RegExp(rule.pattern, 'g');
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = re.exec(flat)) !== null) {
          if (m[0].length === 0) {
            re.lastIndex++;
            continue;
          }
          ranges.push([m.index, m.index + m[0].length]);
          if (++guard > 10000) break; // 正则爆炸兜底
        }
      } catch {
        continue; // 非法正则兜底（创建时已校验）
      }
    }

    // 2) 剔除与已遮蔽区间重叠的命中（immune 语义）
    const maskedIntervals = collectMasked(pieces);
    const effective = ranges.filter(
      ([s, e]) => !maskedIntervals.some(([ms, me]) => s < me && ms < e),
    );
    if (effective.length === 0) continue;

    // 3) 本轮全部有效区间一次性批量替换（区间坐标同源，杜绝逐个替换的坐标错位）
    pieces = replaceRanges(pieces, effective, rule.replacementToken, rule.id);

    mappings.set(rule.id, {
      ruleId: rule.id,
      docId: '*',
      original: rule.ruleType === 'literal' ? rule.pattern : `/${rule.pattern}/`,
      replacement: rule.replacementToken,
      count: effective.length,
    });
  }

  const list = [...mappings.values()];
  return {
    segments: pieces,
    mappings: list,
    totalHits: list.reduce((n, m) => n + m.count, 0),
  };
}

/** 收集全部已遮蔽区间的扁平坐标 */
function collectMasked(pieces: Piece[]): [number, number][] {
  const out: [number, number][] = [];
  let pos = 0;
  for (const p of pieces) {
    if (p.masked) out.push([pos, pos + p.text.length]);
    pos += p.text.length;
  }
  return out;
}

/** 把全部命中区间（升序、同源坐标）一次性替换：每区间一个占位段；masked 段原样保留；跨段区间只产一个占位符 */
function replaceRanges(pieces: Piece[], ranges: [number, number][], token: string, ruleId: string): Piece[] {
  const out: Piece[] = [];
  let pos = 0; // 全局游标
  let ri = 0;
  for (const p of pieces) {
    const pEnd = pos + p.text.length;
    if (p.masked) {
      out.push(p);
      pos = pEnd;
      continue;
    }
    let local = 0;
    while (ri < ranges.length && ranges[ri][0] < pEnd) {
      const [s, e] = ranges[ri];
      const ls = Math.max(s - pos, local);
      const le = Math.min(e - pos, p.text.length);
      if (ls > local) out.push({ text: p.text.slice(local, ls), masked: false });
      out.push({ text: token, masked: true, ruleId });
      local = le;
      ri++;
      if (e >= pEnd) break;
    }
    if (local < p.text.length) out.push({ text: p.text.slice(local), masked: false });
    pos = pEnd;
  }
  return out;
}

/** 占位符生成：[标签_n]，n 取未用的最小序号 */
export function nextToken(rules: Rule[], tag: string): string {
  const used = new Set(rules.map((r) => r.replacementToken));
  let n = 1;
  while (used.has(`[${tag}_${n}]`)) n++;
  return `[${tag}_${n}]`;
}
