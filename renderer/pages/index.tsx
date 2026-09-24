import { useCallback, useEffect, useState } from 'react';
import { QueuePane } from '../components/QueuePane';
import { ReaderPane } from '../components/ReaderPane';
import { RulesPane } from '../components/RulesPane';
import { QuickPane } from '../components/QuickPane';
import { bridge, newSession } from '../lib/session-client';
import { importViaDrop, importViaPicker } from '../lib/import-client';
import { nextToken, applyRules } from '../lib/rules-engine';
import { buildZip, scanPii } from '../lib/export-builder';
import type { DocItem, Rule, RuleTag, Session } from '../lib/types';

const DEFAULT_SESSION_ID = 'default';

type Tab = 'workbench' | 'quick';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState<Tab>('workbench');

  const persist = useCallback(async (s: Session) => {
    const r = await bridge().saveSession(s);
    setSavedAt(new Date(r.updatedAt).toLocaleTimeString('zh-CN', { hour12: false }));
  }, []);

  const upsertDoc = useCallback((doc: DocItem) => {
    setSession((prev) => {
      if (!prev) return prev;
      const docs = [...prev.docs];
      const i = docs.findIndex((d) => d.id === doc.id);
      if (i >= 0) docs[i] = doc;
      else docs.push(doc);
      return { ...prev, docs };
    });
  }, []);

  const load = useCallback(async () => {
    const existing = await bridge().loadSession(DEFAULT_SESSION_ID);
    setSession(existing ?? newSession('未命名项目'));
  }, []);

  const runImport = useCallback(
    async (mode: 'drop' | 'pick', files?: File[]) => {
      if (!session || importing) return;
      setImporting(true);
      try {
        const onDoc = (d: DocItem) => {
          upsertDoc(d);
          if (d.status === 'ready') setSelectedDocId((cur) => cur ?? d.id);
        };
        if (mode === 'drop' && files) await importViaDrop(session, files, onDoc);
        else await importViaPicker(session, onDoc);
      } finally {
        setImporting(false);
      }
    },
    [session, importing, upsertDoc],
  );

  // ---- 规则操作（ADR-5：视图纯函数，规则变更即视图变更） ----
  const addRule = useCallback((pattern: string, tag: RuleTag) => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.rules.some((r) => r.pattern === pattern && r.enabled)) return prev;
      const rule: Rule = {
        id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        tag,
        ruleType: 'literal',
        pattern,
        replacementToken: nextToken(prev.rules, tag),
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, rules: [...prev.rules, rule] };
    });
  }, []);

  const toggleRule = useCallback((id: string) => {
    setSession((prev) =>
      prev
        ? { ...prev, rules: prev.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) }
        : prev,
    );
  }, []);

  const deleteRule = useCallback((id: string) => {
    setSession((prev) => (prev ? { ...prev, rules: prev.rules.filter((r) => r.id !== id) } : prev));
  }, []);

  const exportRules = useCallback(async () => {
    if (!session) return;
    const json = JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), rules: session.rules },
      null,
      2,
    );
    await bridge().exportRules(json);
  }, [session]);

  const importRules = useCallback(async () => {
    const r = await bridge().importRules();
    if (!r.ok || !r.json) return;
    try {
      const parsed = JSON.parse(r.json) as { rules?: Rule[] };
      const incoming = Array.isArray(parsed.rules) ? parsed.rules : [];
      setSession((prev) => {
        if (!prev) return prev;
        const seen = new Set(prev.rules.map((x) => `${x.pattern}|${x.replacementToken}`));
        const merged = [...prev.rules];
        for (const rule of incoming) {
          const key = `${rule.pattern}|${rule.replacementToken}`;
          if (!rule.pattern || seen.has(key)) continue;
          seen.add(key);
          merged.push({
            ...rule,
            id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          });
        }
        return { ...prev, rules: merged };
      });
    } catch {
      // 非法 JSON 静默忽略（main 侧已校验可读）
    }
  }, []);

  useEffect(() => {
    load();
    bridge()
      .appInfo()
      .then((info) => setAppVersion(info.version));
  }, [load]);

  useEffect(() => {
    if (session && (session.docs.length > 0 || session.rules.length > 0)) void persist(session);
  }, [session, persist]);

  // ---- 导出（FR-5 + PII 门禁） ----
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const exportZip = useCallback(async () => {
    if (!session || exporting) return;
    const readyDocs = session.docs.filter((d) => d.status === 'ready' && d.originalMarkdown);
    if (readyDocs.length === 0) {
      setExportNote('没有可导出的就绪文档');
      return;
    }
    setExporting(true);
    setExportNote(null);
    try {
      const rawBytes = new Map<string, Uint8Array>();
      for (const d of readyDocs) {
        if (d.rawPath) rawBytes.set(d.id, await bridge().readRaw(d.rawPath));
      }
      // PII 门禁：扫描脱敏视图，命中须用户确认（决定权还用户）
      const hits = scanPii(
        readyDocs.map((d) => {
          const applied = applyRules(d.originalMarkdown!, session.rules);
          return applied.segments.map((s) => s.text).join('');
        }),
      );
      if (hits.length > 0) {
        const detail = hits.slice(0, 5).map((h) => `${h.label} ${h.sample}`).join('、');
        const ok = window.confirm(
          `脱敏后文档中仍检测到 ${hits.length} 处疑似敏感信息：\n${detail}\n\n确认仍要导出吗？`,
        );
        if (!ok) {
          setExportNote('已取消导出（请补充脱敏规则）');
          return;
        }
      }
      const bytes = await buildZip({ session, appVersion: appVersion || '0.1.0', rawBytes });
      const stamp = new Date().toISOString().slice(0, 10);
      const r = await bridge().saveExport(`maskdesk-export-${session.name}-${stamp}.zip`, bytes);
      setExportNote(r.ok ? `已导出 ${r.path}` : '导出已取消');
    } catch (err) {
      setExportNote(`导出失败：${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [session, exporting, appVersion]);

  const selectedDoc = session?.docs.find((d) => d.id === selectedDocId) ?? null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          maskdesk
        </div>
        <nav className="tab-nav">
          <button
            className={`tab-nav__item${tab === 'workbench' ? ' tab-nav__item--on' : ''}`}
            onClick={() => setTab('workbench')}
          >
            文档工作台
          </button>
          <button
            className={`tab-nav__item${tab === 'quick' ? ' tab-nav__item--on' : ''}`}
            onClick={() => setTab('quick')}
          >
            快速脱敏
          </button>
        </nav>
        <div className="topbar-meta">
          {importing ? <span className="importing-flag">导入中…</span> : null}
          {exporting ? <span className="importing-flag">打包中…</span> : null}
          {exportNote ? <span>{exportNote}</span> : savedAt ? <span>已保存 {savedAt}</span> : null}
          {tab === 'workbench' ? (
            <button className="btn btn--accent" onClick={() => void exportZip()} disabled={!session || exporting}>
              导出 ZIP
            </button>
          ) : null}
          <button
            className="btn btn--accent"
            onClick={() => session && persist(session)}
            disabled={!session}
          >
            保存会话
          </button>
          <span>v{appVersion || '—'}</span>
        </div>
      </header>
      {tab === 'workbench' ? (
        <main className="workbench">
          <QueuePane
            session={session}
            selectedId={selectedDocId}
            onSelect={setSelectedDocId}
            onDrop={(files) => void runImport('drop', files)}
            onPick={() => void runImport('pick')}
          />
          <ReaderPane doc={selectedDoc} rules={session?.rules ?? []} onCreateRule={addRule} />
          <RulesPane
            session={session}
            onToggle={toggleRule}
            onDelete={deleteRule}
            onExport={() => void exportRules()}
            onImport={() => void importRules()}
          />
        </main>
      ) : (
        <main className="quick-host">
          <QuickPane />
        </main>
      )}
    </div>
  );
}
