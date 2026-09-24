import { useRef, useState } from 'react';
import type { DocItem, Session } from '../lib/types';

const STATUS_TEXT: Record<DocItem['status'], string> = {
  pending: '等待',
  converting: '转换中…',
  ready: '就绪',
  failed: '失败',
};

function fmtSize(n: number): string {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
}

interface Props {
  session: Session | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (files: File[]) => void;
  onPick: () => void;
}

/** 第 1 栏 · 文档队列：拖拽/选择导入 + 转换状态机展示（FR-1） */
export function QueuePane({ session, selectedId, onSelect, onDrop, onPick }: Props) {
  const [dragging, setDragging] = useState(false);
  const counter = useRef(0);
  const docs = session?.docs ?? [];

  return (
    <section
      className={`pane pane--queue${dragging ? ' pane--drop-active' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault();
        counter.current++;
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (--counter.current <= 0) setDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        counter.current = 0;
        setDragging(false);
        onDrop(Array.from(e.dataTransfer.files));
      }}
    >
      <header className="pane-head">
        <span className="pane-head__index">01</span>
        <span className="pane-head__title">文档队列</span>
        <button className="btn pane-head__action" onClick={onPick}>
          选择文件
        </button>
      </header>
      <div className="pane-body">
        {docs.length === 0 ? (
          <div className="empty">
            <span className="empty__num">{dragging ? '↓' : '0'}</span>
            <span className="empty__title">{dragging ? '松开即导入' : '尚未导入文档'}</span>
            <span className="empty__hint">
              将 DOCX / PDF / Markdown / TXT
              <br />
              拖入本栏，自动转换为 Markdown
              <br />
              全程本地处理，零网络上传
            </span>
          </div>
        ) : (
          <ul className="doc-list">
            {docs.map((d) => (
              <li
                key={d.id}
                className={`doc-item${d.id === selectedId ? ' doc-item--selected' : ''}`}
                onClick={() => d.status === 'ready' && onSelect(d.id)}
              >
                <span className={`status-dot status-dot--${d.status}`} />
                <div className="doc-item__body">
                  <div className="doc-item__name">{d.name}</div>
                  <div className="doc-item__meta">
                    {d.status === 'ready'
                      ? `${fmtSize(d.size)} · ${STATUS_TEXT[d.status]}`
                      : d.status === 'failed'
                        ? d.error
                        : STATUS_TEXT[d.status]}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
