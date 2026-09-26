# Windows 交付冒烟清单（A1–A7）

> 对应 PRD 验收标准。开发机（Linux 无头）已覆盖的类型/构建/算法证据见 `tasks/CHG-001/goal-state.yaml`；
> 本清单是**在 Windows 真机上的最终验收步骤**，全部通过即为 CHG-001 交付完成。

## 准备

1. 打开 GitHub 仓库 → [Releases](https://github.com/hhx465453939/maskdesk/releases) → 下载最新版
2. 二选一：
   - **便携包** `maskdesk-win-portable.zip` → 解压 → 双击 `maskdesk.exe`
   - **安装包** `maskdesk-setup-*.exe` → 安装 → 从开始菜单/桌面启动

## 步骤

| # | 操作 | 预期 | PRD |
|---|------|------|-----|
| A1-1 | 双击 maskdesk.exe（无 Node/Python 的裸机） | 主界面出现：三栏布局 + 顶栏 maskdesk 品牌 | FR-6 |
| A1-2 | 联网状态打开 DevTools（F12）Network 面板 | 0 外部网络请求 | 约束 |
| A2-1 | 拖入 1 份 DOCX + 1 份 PDF + 1 份 MD | 队列三项变绿「就绪」，点选可预览 Markdown | FR-1 |
| A2-2 | 拖入 1 份扫描图片型 PDF | 队列红色「失败」，提示 E1002 明确文案 | FR-1 |
| A3-1 | 阅读区划选一个出现 3 次的人名 → 点「姓名」 | 全文 3 处替换为 [姓名_1] 并出现黑色遮挡条 | FR-2 |
| A3-2 | 规则侧栏该条命中计数 | 与实际命中数一致 | FR-2 |
| A4-1 | 取消勾选该规则（或点 × 删除） | 全文立即还原原文 | FR-2 |
| A5-1 | 切「快速脱敏」页签 → 粘贴含手机号文本 → 勾选「手机号」 | 输出区即时替换，点复制/下载可用 | FR-4 |
| A6-1 | 点「导出 ZIP」→ 保存 | ZIP 内含 manifest.json / rules.json / raw/ / markdown/ / sanitized/ 五件 | FR-5 |
| A6-2 | 打开 sanitized/*.md 全文搜索已圈选原文 | 0 命中；rules.json 中映射与命中数一致 | FR-5 |
| A7-1 | 断开网络重复 A2–A6 | 全流程可用（本应用离线工作） | 约束 |
| A1-3 | 有一次 0 规则直接导出含手机号的文档 | 弹 PII 门禁确认框 | FR-2/5 |

## 已知限制（如实告知）

- 扫描图片型 PDF 不支持（需先 OCR），导入时明确报错
- PDF 表格转文本流（不做版式完美还原）
- macOS / Linux 未打包
- 本项目不构成 HIPAA /《个人信息保护法》合规承诺
