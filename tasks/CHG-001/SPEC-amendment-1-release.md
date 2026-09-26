# SPEC Amendment 1 · CHG-001 · Windows 交付形态与 Release 发布

- **date**: 2026-09-26 · **status**: APPROVED（主人经 AskUserQuestion 拍板）
- **supersedes**: PRD G3「仅便携版」决议 + SPEC §3 ADR「规避 NSIS/wine」

## 背景

M6 交付后，产物仅以 CI artifact（14 天保留）形式存在，无 GitHub Release，用户拿不到「release 可见」的稳定交付物。且原始「仅便携版」决议的前提（Linux 无头开发机规避 wine）已不成立——CI 现于 `windows-latest` 真机构建，NSIS 原生可用。

## 变更

| 项 | 原决议 | 新决议 |
|---|---|---|
| Windows 交付形态 | 仅便携版（dir + zip） | **双形态**：NSIS 安装包 + 便携 zip |
| Release 发布 | 无（仅 artifact） | 推 `v*` tag 触发，产物挂 GitHub Release（`workflow_dispatch` 手动兜底） |

## 实现落点

- `electron-builder.yml`：`win.target: [nsis, dir]` + `nsis` 段（per-user、可选安装目录、桌面/开始菜单快捷方式）
- `.github/workflows/release.yml`：tag/手动触发，构建双形态 → `softprops/action-gh-release` 发布
- `package.json`：补 `author`/`license` 元数据、`dist:win` 脚本、修复 `typecheck:renderer`（`npm exec --prefix` cwd 缺陷）

## 未变

- 仍不签名（无证书）；仍不打包 macOS/Linux；仍为「便携/安装皆离线零网络」。
- 应用图标仍用默认（debt 未清，非本次范围）。
