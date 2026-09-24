import { useMemo, useState } from 'react';
import { applyRules } from '../lib/rules-engine';
import { DETECTORS } from '../lib/detectors';
import type { Rule } from '../lib/types';

/** 快速字段脱敏（FR-4）：任意文本传入 → 识别器勾选 → 即时脱敏输出 */
export function QuickPane() {
  const [input, setInput] = useState('');
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(DETECTORS.filter((d) => d.enabledByDefault).map((d) => d.id)),
  );
  const [copied, setCopied] = useState(false);

  const detectorRules: Rule[] = useMemo(
    () =>
      DETECTORS.filter((d) => enabled.has(d.id)).map((d) => ({
        id: d.id,
        tag: d.tag,
        ruleType: 'regex' as const,
        pattern: d.regex,
        replacementToken: d.token,
        enabled: true,
        createdAt: '',
      })),
    [enabled],
  );

  const output = useMemo(() => {
    if (!input) return { segments: [], hits: 0 };
    const r = applyRules(input, detectorRules);
    return { segments: r.segments, hits: r.totalHits };
  }, [input, detectorRules]);

  const toggle = (id: string): void => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyOut = async (): Promise<void> => {
    const text = output.segments.map((s) => s.text).join('');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = (): void => {
    const text = output.segments.map((s) => s.text).join('');
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `maskdesk-quick-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="quick">
      <div className="quick__detectors">
        <span className="pane-head__title">内置识别器</span>
        {DETECTORS.map((d) => (
          <label key={d.id} className="detector-chip">
            <input
              type="checkbox"
              checked={enabled.has(d.id)}
              onChange={() => toggle(d.id)}
            />
            {d.label}
          </label>
        ))}
      </div>
      <div className="quick__io">
        <div className="quick__col">
          <div className="quick__col-head">
            <span>输入文本</span>
            <span className="quick__hits">命中 {output.hits} 处</span>
          </div>
          <textarea
            className="quick__textarea"
            placeholder="粘贴任意需要脱敏的文本或字段…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="quick__col">
          <div className="quick__col-head">
            <span>脱敏输出</span>
            <span>
              <button className="btn" onClick={() => void copyOut()} disabled={!output.hits}>
                {copied ? '已复制 ✓' : '复制'}
              </button>{' '}
              <button className="btn btn--accent" onClick={download} disabled={!output.hits}>
                下载 .md
              </button>
            </span>
          </div>
          <pre className="quick__out">
            {output.segments.map((s, i) =>
              s.masked ? (
                <span className="mask-bar" key={i}>
                  {s.text}
                </span>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
