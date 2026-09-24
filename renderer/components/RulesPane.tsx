import type { Rule, Session } from '../lib/types';

interface Props {
  session: Session | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/** 第 3 栏 · 规则库（M3 最小版：列表/启停/删除；M4 补导入导出与快速模式） */
export function RulesPane({ session, onToggle, onDelete }: Props) {
  const rules = session?.rules ?? [];
  return (
    <section className="pane pane--rules">
      <header className="pane-head">
        <span className="pane-head__index">03</span>
        <span className="pane-head__title">脱敏规则库</span>
        <span className="pane-head__count">{rules.length}</span>
      </header>
      <div className="pane-body">
        {rules.length === 0 ? (
          <div className="empty">
            <span className="empty__num">0</span>
            <span className="empty__title">暂无规则</span>
            <span className="empty__hint">
              在正文圈选文字即自动建规则
              <br />
              规则跨文档复用，可导出 JSON
            </span>
          </div>
        ) : (
          <ul className="rule-list">
            {rules.map((r: Rule) => (
              <li key={r.id} className={`rule-item${r.enabled ? '' : ' rule-item--off'}`}>
                <label className="rule-item__enable">
                  <input type="checkbox" checked={r.enabled} onChange={() => onToggle(r.id)} />
                </label>
                <div className="rule-item__body">
                  <div className="rule-item__head">
                    <span className="rule-item__tag">{r.tag}</span>
                    <span className="rule-item__token">{r.replacementToken}</span>
                  </div>
                  <div className="rule-item__pattern">{r.pattern}</div>
                </div>
                <button
                  className="rule-item__delete"
                  title="删除规则"
                  onClick={() => onDelete(r.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
