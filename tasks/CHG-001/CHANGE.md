# CHG-001 · maskdesk 立项：本地文档脱敏客户端（纯前端）

- **change_id**: CHG-001
- **date**: 2026-09-24
- **owner**: 主人
- **status**: APPROVED（主人 2026-09-24 批准：定名 maskdesk / Electron(nextron) / userData JSON / 仅便携版）
- **来源**：
  - 功能抽取源：`~/Development/family_health`（文档上传 → 手动脱敏 → 打包导出链路；已实现于 FastAPI + React，本地 codebase 图谱索引）
  - 产品策划源：`https://github.com/hhx465453939/maskdesk`（README 策划案，本仓库前身 casemask 已整体更名并入）
- **一句话**：把 family_health 中的「上传-手动脱敏-打包导出」能力抽成独立轻量客户端——Next.js 纯前端、Windows 一键运行、选中即脱敏、一次性导出脱敏规则映射与脱敏前+脱敏后文档压缩包。

## 范围

- ✅ 新建独立项目 `~/Development/maskdesk`
- ✅ 四大核心功能（见 PRD FR-1 ~ FR-6）
- ✅ 视觉按美学种子库（agent-taste-seed-system）决策：瑞士平面主基因
- ❌ 不含 family_health 的聊天/RAG/知识库/模型中心等其余模块
- ❌ 不含 OCR 扫描件识别、云同步、多人协作（非目标）

## 参考实现情报（已核实）

| family_health 组件 | 行为 | maskdesk 去向 |
|---|---|---|
| `services/desensitization_service.py` | 规则 `{rule_type: literal\|regex, pattern, replacement_token, tag, enabled}` → 正则替换 → 映射记录 → 高风险 PII 强门禁 | 前端 TS 重写（核心算法照搬行为） |
| `api/v1/export.py` + `services/export_service.py` | ZIP = manifest.json + 原文件 + 脱敏文本 + 规则 | jszip 浏览器端打包 |
| `api/v1/file_preview.py` / 上传链路 | Python 端转 Markdown | mammoth + turndown + pdfjs 浏览器端转换 |
| `components/DesensitizationModal.tsx` | 选中建规则弹窗 | 重设计为选中气泡 + 规则侧栏 |

## 下一步

PRD 批准后 → SPEC（含 ADR：Electron/nextron vs Tauri 等）→ goal-driven-development 执行。
