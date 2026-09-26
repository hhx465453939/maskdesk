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

**CHG-001 六里程碑全部完成**（M1 骨架 → M2 导入转换 → M3 选中即脱敏 → M4 规则库+快速模式 → M5 导出门禁 → M6 Windows 交付）。推 `v*` 版本 tag 时 CI 自动构建并发布 Windows 安装包 + 便携包到 GitHub Release。

### 📦 下载使用（Windows 10/11）

在 [Releases 页面](https://github.com/hhx465453939/maskdesk/releases) 下载最新版本，二选一：

- **安装包**：`maskdesk-setup-*.exe` —— 标准安装器，安装到程序目录 + 开始菜单/桌面快捷方式 + 卸载项
- **便携包**：`maskdesk-win-portable.zip` —— 解压后双击 `maskdesk.exe` 免安装即用（离线可用，文档不出机）

最终验收步骤见 [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md)。

### 🗂 立项与工程契约

见 [`tasks/CHG-001/`](tasks/CHG-001/)（CHANGE / PRD / SPEC / TRACEABILITY / goal-state）；功能行为参考 family_health 平台已验证的脱敏链路（规则模型 / 线性脱敏 / 映射记录 / ZIP 结构）。

## ⚠️ 免责声明（重要）

maskdesk 按 [Apache-2.0](LICENSE) 许可开源，按"原样"提供，不附带任何明示或默示担保。使用前请知悉：

- **非医疗器械**：本项目不是医疗器械，不用于临床诊断、治疗决策或任何直接影响患者安全与权益的用途。
- **脱敏是"尽力而为"**：脱敏结果不保证 100% 去除所有受保护健康信息（PHI）或个人敏感信息。规则引擎按既定规则工作，不保证覆盖所有字段、变体或非结构化文本中的信息；交付第三方（含 AI/LLM）前务必人工复核。
- **不构成合规承诺**：本项目不构成、也不替代 HIPAA /《个人信息保护法》/ GDPR 等任何法规的合规保证。正式场景请配合所在机构的合规流程、伦理审查与数据保护官意见使用。
- **责任自负**：您对脱敏结果的核验、对输出数据的使用与分发负全部责任。因使用或无法使用本软件（包括但不限于数据泄露、脱敏不完整、合规瑕疵、商业损失）造成的任何损失，作者与贡献者在适用法律允许的最大范围内不承担责任（详见 Apache-2.0 第 7、8 条）。
