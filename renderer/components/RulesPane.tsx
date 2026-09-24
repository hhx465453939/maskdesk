import type { Session } from '../lib/types';

/** 第 3 栏 · 规则库（M1 骨架：空状态；M4 接规则 CRUD 与快速模式） */
export function RulesPane({ session }: { session: Session | null }) {
  const count = session?.rules.length ?? 0;
  return (
    <section className="pane pane--rules">
      <header className="pane-head">
        <span className="pane-head__index">03</span>
        <span className="pane-head__title">脱敏规则库</span>
      </header>
      <div className="pane-body">
        {count === 0 ? (
          <div className="empty">
            <span className="empty__num">0</span>
            <span className="empty__title">暂无规则</span>
            <span className="empty__hint">
              在正文圈选文字即自动建规则
              <br />
              规则跨文档复用，可导出 JSON
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
