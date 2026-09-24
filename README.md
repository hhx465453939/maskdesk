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

- **CHG-001 开发中**（2026-09-24 立项）：独立轻量 Windows 桌面客户端，双击即用、离线可用
- 立项与工程契约见 [`tasks/CHG-001/`](tasks/CHG-001/)（CHANGE / PRD / SPEC）
- 功能行为参考 family_health 平台已验证的脱敏链路（规则模型 / 线性脱敏 / 映射记录 / ZIP 结构）

## ⚠️ 免责声明

本项目面向科研与个人工作流辅助，不构成 HIPAA /《个人信息保护法》的合规承诺；正式场景请配合所在机构合规流程使用。
