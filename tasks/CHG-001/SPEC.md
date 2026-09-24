---
change_id: CHG-001
version: 1
status: approved
prd_ref: PRD.md (v2, APPROVED)
health_ref: null（新项目无历史健康基线；family_health 参考链路已在 CHANGE.md 核实）
supersedes: null
approved_by: 主人（2026-09-24，经 AskUserQuestion 明确批准）
approved_at: 2026-09-24
---

# SPEC · maskdesk CHG-001 · 本地文档脱敏客户端

## 1. Context / Goal / Non-goals / Constraints / Assumptions / Unresolved

**Context**：casemask 策划（本仓库前身）+ family_health 已验证脱敏链路（规则模型/线性脱敏/映射记录/ZIP 结构）→ 抽取为独立纯前端 Windows 客户端。

**Goal**：Windows 双击即用的脱敏工作台——导入多格式文书 → 本地转 Markdown → 选中即脱敏建规则 → 一次性导出「规则映射 + 脱敏前 + 脱敏后」ZIP。全程离线，文档不出机。

**Non-goals**：OCR/扫描件、云同步/账号、多人协作、非 Windows 平台打包、合规承诺。

**Constraints**：
- 纯前端架构：无任何网络请求（A1 用 DevTools Network 面板验收 0 外部请求）
- Electron(nextron) + userData JSON 持久化 + 仅便携版交付（PRD 决议）
- 视觉按美学种子库「瑞士平面/包豪斯」主基因（code-genes/01），功能色医疗青 #0f766e

**Assumptions**：目标机 Windows 10/11 x64；文档单份 ≤50MB；项目 Node ≥20 可用（M1 前核查）。

**Unresolved**：无（PRD gap 四项均已决议）。

## 2. Current Architecture & Debt Impact

全新项目，无存量债务。复用资产：family_health 行为逻辑（Python → TypeScript 重写）；casemask 技术选型（nextron/mammoth/pdfjs/Turndown）。debt 影响为 0，但须防"参考移植债"：不照抄 family_health 的 DB/多用户层，只取纯函数行为。

## 3. Selected Design & ADR

### ADR-1 桌面壳：Electron(nextron)
- **选**：nextron（Next.js renderer + Electron main），casemask 策划原案，生态成熟，Linux 上可开发调试。
- **弃**：Tauri（本机无 Rust 工具链，交叉编译 Windows 调试成本高）；纯浏览器（无法一键运行）。
- **后果**：包体 ~150MB（可接受）；**可逆性**：renderer 层与壳解耦，未来可换壳。

### ADR-2 持久化：Electron userData JSON
- **选**：main 进程 fs 读写 `userData/sessions/<id>.json`，renderer 经 IPC 存取。
- **弃**：IndexedDB（不可见、不可手工备份，不符隐私工具气质）。
- **后果**：会话可手工备份/迁移；单会话超大（>50 文档）时性能需关注（M5 观测点）。

### ADR-3 转换管线：浏览器端库
- DOCX：`mammoth` → HTML → `turndown` → Markdown；PDF：`pdfjs-dist` 文本层 → 段落/标题启发式重组；MD/TXT：直读。
- **弃**：服务端转换（违反纯前端约束）。
- **声明**：PDF 表格转为文本流（PRD 已声明"尽量保留"，不做版式完美还原）。

### ADR-4 导出落盘：主进程 dialog + fs（非 Blob 下载）
- renderer 用 `jszip` 生成 ZIP Buffer → IPC → main `dialog.showSaveDialog` → `fs.writeFile`。
- **弃**：Browser Blob 下载（走 Chromium 下载流程，路径不可控，桌面体验差）。

### ADR-5 脱敏引擎：视图纯函数（核心决策）
- **选**：每文档永久保存 `originalMarkdown`；脱敏视图 = `applyRules(original, enabledRules)` 纯函数，实时计算不落库。规则启停/删除/撤销天然可逆（重算视图即可），映射记录在计算时聚合生成。
- **弃**：family_health 式就地替换 + 反向还原（需维护 undo 栈，易错）。
- **后果**：性能 = O(文档字数 × 规则数)，输入规模下（≤50MB/份）需做规则合并与增量计算（M3 观测点）。

### ADR-6 选中即脱敏渲染：react-markdown 自定义渲染层
- markdown 渲染为受控 DOM（每个文本节点可定位），Selection API 捕获划选 → 反查文档偏移 → 建规则 → 视图重算后**占位符渲染为遮挡条样式**。
- **兜底**（R2）：若跨节点选区映射不稳，降级为「文本层编辑器」方案（等宽纯文本 + 结构标记）。
- **产物记忆点**：命中替换处渲染为黑色遮挡条滑入动效（美学辅基因，唯一装饰）。

## 4. Interfaces / Data / Security / Compatibility / Observability / Rollout / Rollback

### 数据契约（TypeScript 单一来源 `lib/types.ts`）
```ts
Rule      { id, tag, ruleType: 'literal'|'regex', pattern, replacementToken, enabled, hitCount, createdAt }
Mapping   { ruleId, docId, original, replacement, count }
DocItem   { id, name, kind: 'docx'|'pdf'|'md'|'txt', size, status: 'pending'|'converting'|'ready'|'failed',
            rawPath?, originalMarkdown?, error? }
Session   { id, name, docs: DocItem[], rules: Rule[], mappings: Mapping[], version, createdAt, updatedAt }
```

### IPC 契约（main ↔ renderer，`lib/ipc-channels.ts`）
| channel | 方向 | 载荷 |
|---|---|---|
| `import:pick` | R→M | `{}` → `DialogOpenResult`（复制导入文件到 `userData/imports/<sessionId>/`） |
| `session:save` / `session:list` / `session:load` | R→M | Session JSON |
| `export:save` | R→M | `{ defaultName, zip: Buffer }` → 保存路径 |
| `app:version` | R→M | 版本号 |

### Security
- 零网络：`nodeIntegration: false`，`contextIsolation: true`；pdfjs/mammoth 全本地；CSP 禁外链
- 正则安全：regex 规则创建时 `re.compile` 等价校验 + ReDoS 防护（限长 500、禁嵌套量词黑名单）
- PII 门禁：导出前对 sanitized 视图跑高风险特征族（手机号/身份证/邮箱），命中 → 用户确认方可导出（沿 family_health 强门禁语义，决定权还用户）

### Compatibility / Rollout / Rollback
- Windows 10/11 x64；便携版 = `electron-builder --dir` 产物（win-unpacked）打 zip——**规避 NSIS/wine**（比 PRD G3 措辞更精确的实现定义）
- Rollout：M1-M6 逐里程碑交付；Rollback：git 里程碑 tag，会话 JSON 向后兼容字段只增不删

### Observability
- 转换/导出失败结构化错误码（E1xxx 转换 / E2xxx 规则 / E3xxx IO）+ 主界面错误条；dev 模式 electron-log

## 5. Milestones（依赖序；每个 = 一个 implement/check/review 循环）

| # | 里程碑 | 内容/文件 | 验收 | 风险→回滚 |
|---|--------|----------|------|----------|
| M1 | 骨架与设计系统 | nextron init；`styles/tokens.css`（code-genes/01 全参数）；三栏布局；IPC 骨架与会话持久化闭环 | 布局渲染、会话保存重开不丢 | nextron 版本坑→锁版本 |
| M2 | 导入与归一化 | 拖拽导入、docx/pdf/md/txt→md 管线（`lib/convert/`）、队列状态机、预览 | A2 | pdfjs 文本质量→声明式降级 |
| M3 | 选中即脱敏 | Selection 捕获、规则气泡、applyRules 引擎、遮挡条高亮、双视图、撤销 | A3、A4 | 跨节点选区→ADR-6 兜底 |
| M4 | 规则库与快速模式 | 规则侧栏 CRUD/启停、规则 JSON 导入导出、快速页签 + 内置识别器注册表 | A5 | — |
| M5 | 导出与门禁 | jszip 组装（manifest/rules/raw/markdown/sanitized）、PII 门禁、IPC 落盘 | A6 | 大会话性能→分块 zip |
| M6 | Windows 便携交付 | electron-builder --dir + zip、品牌图标、A1/A7 冒烟、交付清单 | A1、A7 | — |

**PRD 措辞修正备案**：FR-4「30+ 内置识别器」修正为「首批 8 类高频识别器（手机/身份证/邮箱/日期/住院号样式的数字串/身份证日期混合/URL/自定义正则）+ 可扩展注册表」——宁少而准，TRACEABILITY 已注明。

## 6. DoR / DoD

- **DoR**：PRD APPROVED ✅；里程碑入口条件明确；依赖版本锁定
- **DoD**：lint + typecheck + build 全绿；该里程碑验收项有可复现证据；测试产物清扫（T0/T1）；无调试残留（T3）；受影响层（renderer/main/文档）齐头并进核对

## 7. Review & Delivery Gates

- 每里程碑：实现 → 自查 check → 向主人汇报（review Gate）
- commit Gate：主人批准后按逻辑单元提交（显式列文件，禁止 `git add .`）
- push Gate：脱敏终扫（宿主机用户名、本机绝对路径、IP、凭证特征串全树 0 命中）+ 主人明示后推送

## 8. Traceability & Evidence Plan

见 `TRACEABILITY.md`（A1-A7 ↔ FR-1~6 ↔ M1-M6 ↔ 证据形态一一映射）。
