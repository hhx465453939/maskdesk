import type { Rule, Session } from '../lib/types';

interface Props {
  session: Session | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
}

/** 第 3 栏 · 规则库：列表/启停/删除 + JSON 导入导出（跨项目复用） */
export function RulesPane({ session, onToggle, onDelete, onExport, onImport }: Props) {
  const rules = session?.rules ?? [];
  return (
    <section className="pane pane--rules">
      <header className="pane-head">
        <span className="pane-head__index">03</span>
        <span className="pane-head__title">脱敏规则库</span>
        <span className="pane-head__count">{rules.length}</span>
      </header>
      <div className="rule-io">
        <button className="btn" onClick={onExport} disabled={rules.length === 0}>
          导出 JSON
        </button>
        <button className="btn" onClick={onImport}>
          导入 JSON
        </button>
      </div>
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
