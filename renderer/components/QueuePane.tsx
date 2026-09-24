import type { Session } from '../lib/types';

/** 第 1 栏 · 文档队列（M1 骨架：空状态；M2 接导入与转换管线） */
export function QueuePane({ session }: { session: Session | null }) {
  return (
    <section className="pane pane--queue">
      <header className="pane-head">
        <span className="pane-head__index">01</span>
        <span className="pane-head__title">文档队列</span>
      </header>
      <div className="pane-body">
        <div className="empty">
          <span className="empty__num">0</span>
          <span className="empty__title">尚未导入文档</span>
          <span className="empty__hint">
            将 DOCX / PDF / Markdown / TXT
            <br />
            拖入本栏，自动转换为 Markdown
            <br />
            全程本地处理，零网络上传
          </span>
        </div>
      </div>
    </section>
  );
}
