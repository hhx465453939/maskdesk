import { useCallback, useEffect, useState } from 'react';
import { QueuePane } from '../components/QueuePane';
import { ReaderPane } from '../components/ReaderPane';
import { RulesPane } from '../components/RulesPane';
import { bridge, newSession } from '../lib/session-client';
import { importViaDrop, importViaPicker } from '../lib/import-client';
import { nextToken } from '../lib/rules-engine';
import type { DocItem, Rule, RuleTag, Session } from '../lib/types';

const DEFAULT_SESSION_ID = 'default';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [importing, setImporting] = useState(false);

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
  const addRule = useCallback(
    (pattern: string, tag: RuleTag) => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.rules.some((r) => r.pattern === pattern && r.enabled)) return prev; // 去重
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
    },
    [],
  );

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

  useEffect(() => {
    load();
    bridge()
      .appInfo()
      .then((info) => setAppVersion(info.version));
  }, [load]);

  // 文档/规则变更后自动持久化
  useEffect(() => {
    if (session && (session.docs.length > 0 || session.rules.length > 0)) void persist(session);
  }, [session, persist]);

  const selectedDoc = session?.docs.find((d) => d.id === selectedDocId) ?? null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          maskdesk
        </div>
        <span className="session-name">{session ? session.name : '加载中…'}</span>
        <div className="topbar-meta">
          {importing ? <span className="importing-flag">导入中…</span> : null}
          {savedAt ? <span>已保存 {savedAt}</span> : <span>未保存</span>}
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
      <main className="workbench">
        <QueuePane
          session={session}
          selectedId={selectedDocId}
          onSelect={setSelectedDocId}
          onDrop={(files) => void runImport('drop', files)}
          onPick={() => void runImport('pick')}
        />
        <ReaderPane doc={selectedDoc} rules={session?.rules ?? []} onCreateRule={addRule} />
        <RulesPane session={session} onToggle={toggleRule} onDelete={deleteRule} />
      </main>
    </div>
  );
}
