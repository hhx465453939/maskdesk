import { useMemo, useState } from 'react';
import { applyRules } from '../lib/rules-engine';
import type { DocItem, Rule, RuleTag } from '../lib/types';

const TAGS: RuleTag[] = ['姓名', '电话', '日期', '住院号', '身份证', '自定义'];

interface Props {
  doc: DocItem | null;
  rules: Rule[];
  onCreateRule: (pattern: string, tag: RuleTag) => void;
}

/**
 * 第 2 栏 · 阅读与脱敏区（ADR-5 视图纯函数渲染）
 * 划选文字 → 顶部出现建规则条（选标签即全文替换）——字面量规则；
 * 正则规则由规则侧栏管理（M4）。
 */
export function ReaderPane({ doc, rules, onCreateRule }: Props) {
  const [view, setView] = useState<'masked' | 'original'>('masked');
  const [selection, setSelection] = useState<string | null>(null);

  const applied = useMemo(
    () => (doc?.originalMarkdown && view === 'masked' ? applyRules(doc.originalMarkdown, rules) : null),
    [doc?.originalMarkdown, rules, view],
  );

  const onMouseUp = (): void => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? '';
    setSelection(text.length > 0 && text.length <= 200 ? text : null);
  };

  const confirm = (tag: RuleTag): void => {
    if (selection) onCreateRule(selection, tag);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <section className="pane pane--reader" onMouseUp={onMouseUp}>
      <header className="pane-head">
        <span className="pane-head__index">02</span>
        <span className="pane-head__title">阅读 · 圈选脱敏</span>
        {doc ? (
          <span className="view-toggle">
            <button
              className={`toggle-btn${view === 'masked' ? ' toggle-btn--on' : ''}`}
              onClick={() => setView('masked')}
            >
              脱敏视图
            </button>
            <button
              className={`toggle-btn${view === 'original' ? ' toggle-btn--on' : ''}`}
              onClick={() => setView('original')}
            >
              原文
            </button>
          </span>
        ) : null}
        {doc ? <span className="pane-head__doc-name">{doc.name}</span> : null}
      </header>

      {selection && view === 'masked' ? (
        <div className="rule-bar">
          <span className="rule-bar__sel">「{selection.length > 24 ? `${selection.slice(0, 24)}…` : selection}」</span>
          <span className="rule-bar__label">建立为：</span>
          {TAGS.map((t) => (
            <button key={t} className="btn rule-bar__tag" onClick={() => confirm(t)}>
              {t}
            </button>
          ))}
          <button className="btn" onClick={() => setSelection(null)}>
            取消
          </button>
        </div>
      ) : null}

      <div className="pane-body">
        {doc?.originalMarkdown ? (
          applied ? (
            <pre className="reader-pre">
              {applied.segments.map((s, i) =>
                s.masked ? (
                  <span className="mask-bar" key={i} title={s.ruleId}>
                    {s.text}
                  </span>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </pre>
          ) : (
            <pre className="reader-pre">{doc.originalMarkdown}</pre>
          )
        ) : (
          <div className="empty">
            <span className="empty__num">∅</span>
            <span className="empty__title">选择左侧文档开始阅读</span>
            <span className="empty__hint">
              在正文上划选文字（如姓名、住院号）
              <br />
              选择标签即建立规则，全文自动替换
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
