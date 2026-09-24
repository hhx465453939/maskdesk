# maskdesk 🎭

> 本地优先的文档脱敏 · 格式归一化 · AI 预处理工作台
> 把各种格式的文书，安全地变成「可以交给 AI 的脱敏 Markdown」
>
> 仓库：**https://github.com/hhx465453939/maskdesk**（原 casemask，已整体更名）

## 核心流程

导入（PDF / DOCX / Markdown）→ 本地转为 Markdown → 圈选内容建立脱敏规则 → 一键脱敏 → 打包导出 ZIP

## ✨ 特性

- 🔒 **隐私优先 / Local-first**：全流程本地处理，零网络上传，文档不出机
- 📄 **格式归一化**：PDF、DOCX、Markdown 自动转换为统一 Markdown，表格与结构尽量保留
- 🎭 **交互式脱敏规则**：在渲染后的 Markdown 上直接圈选文本，建立「原文 ↔ 占位符」映射；规则可保存、复用、批量套用
- 🧩 **字段级通用脱敏**：任意字段传入即脱敏（姓名 / 电话 / 住院号 / 日期…），识别器可扩展
- 📦 **一键打包导出**：原始文档 + Markdown + 脱敏规则映射（JSON）+ 脱敏后 Markdown → ZIP 下载到本地

## 🎯 使用场景

把脱敏后的病例安全地交给 LLM / 智能体做病历质控、随访摘要、科研入组筛选——maskdesk 是整条 AI 管线的**隐私前置站**。

## 🛠 技术栈

Next.js · Electron（nextron）· mammoth · pdfjs · Turndown · JSZip —— 纯前端架构，无后端服务

## 📌 项目状态

**CHG-001 六里程碑全部完成**（M1 骨架 → M2 导入转换 → M3 选中即脱敏 → M4 规则库+快速模式 → M5 导出门禁 → M6 Windows 交付），CI 每次推送自动构建并产出 Windows 便携包。

### 📦 下载使用（Windows 10/11）

1. 打开 [Actions 页面](https://github.com/hhx465453939/maskdesk/actions) → 选最新成功 run → 下载 artifact **maskdesk-win-portable**
2. 解压 zip → 双击 **maskdesk.exe**（免安装，离线可用，文档不出机）
3. 最终验收步骤见 [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md)

### 🗂 立项与工程契约

见 [`tasks/CHG-001/`](tasks/CHG-001/)（CHANGE / PRD / SPEC / TRACEABILITY / goal-state）；功能行为参考 family_health 平台已验证的脱敏链路（规则模型 / 线性脱敏 / 映射记录 / ZIP 结构）。

## ⚠️ 免责声明

本项目面向科研与个人工作流辅助，不构成 HIPAA /《个人信息保护法》的合规承诺；正式场景请配合所在机构合规流程使用。
