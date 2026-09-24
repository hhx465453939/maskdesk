/** 第 2 栏 · 阅读与脱敏区（M1 骨架：空状态；M3 接选中即脱敏） */
export function ReaderPane() {
  return (
    <section className="pane pane--reader">
      <header className="pane-head">
        <span className="pane-head__index">02</span>
        <span className="pane-head__title">阅读 · 圈选脱敏</span>
      </header>
      <div className="pane-body">
        <div className="empty">
          <span className="empty__num">∅</span>
          <span className="empty__title">选择左侧文档开始阅读</span>
          <span className="empty__hint">
            在渲染后的正文上划选文字即可建立脱敏规则
            <br />
            全文相同内容将立即替换为占位符
          </span>
        </div>
      </div>
    </section>
  );
}
