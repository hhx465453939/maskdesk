/**
 * M3 规则引擎行为冒烟：npx tsx scripts/smoke-rules.ts
 * 断言即规格（SPEC ADR-5 语义 1-4 + 占位符生成）
 */
import { applyRules, nextToken, type Segment } from '../lib/rules-engine';
import type { Rule } from '../lib/types';

let pass = 0;
let fail = 0;

function rule(id: string, ruleType: 'literal' | 'regex', pattern: string, token: string, enabled = true): Rule {
  return { id, tag: '自定义', ruleType, pattern, replacementToken: token, enabled, createdAt: '', };
}

function text(segments: Segment[]): string {
  return segments.map((s) => s.text).join('');
}

function maskedTexts(segments: Segment[]): string[] {
  return segments.filter((s) => s.masked).map((s) => s.text);
}

function check(name: string, cond: boolean, detail: string): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}\n    ${detail}`);
  }
}

// T1 literal 多命中：每处独立占位 + count 聚合
{
  const r = applyRules('张三做了CT，张三签字。', [rule('r1', 'literal', '张三', '[姓名_1]')]);
  check('T1 全文保留占位', text(r.segments) === '[姓名_1]做了CT，[姓名_1]签字。', text(r.segments));
  check('T1 命中数=2', r.totalHits === 2 && r.mappings[0].count === 2, String(r.totalHits));
  check('T1 masked 文本=占位符', maskedTexts(r.segments).join(',') === '[姓名_1],[姓名_1]', maskedTexts(r.segments).join(','));
}

// T2 双规则依次应用
{
  const r = applyRules('张三，电话13800138000，张三已知。', [
    rule('r1', 'literal', '张三', '[姓名_1]'),
    rule('r2', 'regex', '1\\d{10}', '[电话_1]'),
  ]);
  check('T2 双规则替换', text(r.segments) === '[姓名_1]，电话[电话_1]，[姓名_1]已知。', text(r.segments));
  check('T2 命中合计=3', r.totalHits === 3, String(r.totalHits));
}

// T3 免疫语义：已遮蔽区间不被后续规则命中
{
  const r = applyRules('编码123与456', [
    rule('r1', 'literal', '123', '[编号_1]'),
    rule('r2', 'regex', '\\d+', '[数字_1]'),
  ]);
  // 123 已被遮蔽 → 免疫；只有 456 被规则2命中
  check('T3 免疫+后续命中', text(r.segments) === '编码[编号_1]与[数字_1]', text(r.segments));
  check('T3 规则2命中数=1', r.mappings.find((m) => m.ruleId === 'r2')?.count === 1, JSON.stringify(r.mappings));
}

// T4 禁用规则不参与
{
  const r = applyRules('张三张三', [rule('r1', 'literal', '张三', '[姓名_1]', false)]);
  check('T4 禁用不替换', text(r.segments) === '张三张三' && r.totalHits === 0, text(r.segments));
}

// T5 非法正则静默跳过
{
  const r = applyRules('abc', [rule('r1', 'regex', '([bad', '[X]')]);
  check('T5 非法正则不崩', text(r.segments) === 'abc', text(r.segments));
}

// T6 重叠命中整条剔除（不对部分区间手术）
{
  const r = applyRules('a12345b', [
    rule('r1', 'literal', '123', '[A]'),
    rule('r2', 'literal', '12345', '[B]'),
  ]);
  // 规则2 的 '12345' 在 '[A]45b' 上无命中 → 结果保持 r1 的替换
  check('T6 重叠命中整条剔除', text(r.segments) === 'a[A]45b', text(r.segments));
}

// T7 占位符生成
{
  const rules = [
    rule('a', 'literal', 'x', '[姓名_1]'),
    rule('b', 'literal', 'y', '[姓名_3]'),
  ];
  check('T7 最小未用序号', nextToken(rules, '姓名') === '[姓名_2]', nextToken(rules, '姓名'));
  check('T7 新标签从1起', nextToken(rules, '电话') === '[电话_1]', nextToken(rules, '电话'));
}

// T8 空模式/空原文防御
{
  const r = applyRules('', [rule('r1', 'literal', 'x', '[X]')]);
  check('T8 空原文安全', text(r.segments) === '' && r.totalHits === 0, text(r.segments));
}

console.log(`\n规则引擎冒烟: ${pass} 通过 / ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
