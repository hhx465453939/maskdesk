import { useCallback, useEffect, useState } from 'react';
import { QueuePane } from '../components/QueuePane';
import { ReaderPane } from '../components/ReaderPane';
import { RulesPane } from '../components/RulesPane';
import { bridge, newSession } from '../lib/session-client';
import type { Session } from '../lib/types';

const DEFAULT_SESSION_ID = 'default';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('');

  const load = useCallback(async () => {
    const b = bridge();
    const existing = await b.loadSession(DEFAULT_SESSION_ID);
    setSession(existing ?? newSession('未命名项目'));
  }, []);

  const save = useCallback(async () => {
    if (!session) return;
    const r = await bridge().saveSession(session);
    setSavedAt(new Date(r.updatedAt).toLocaleTimeString('zh-CN', { hour12: false }));
  }, [session]);

  useEffect(() => {
    load();
    bridge()
      .appInfo()
      .then((info) => setAppVersion(info.version));
  }, [load]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          maskdesk
        </div>
        <span className="session-name">{session ? session.name : '加载中…'}</span>
        <div className="topbar-meta">
          {savedAt ? <span>已保存 {savedAt}</span> : <span>未保存</span>}
          <button className="btn btn--accent" onClick={save} disabled={!session}>
            保存会话
          </button>
          <span>v{appVersion || '—'}</span>
        </div>
      </header>
      <main className="workbench">
        <QueuePane session={session} />
        <ReaderPane />
        <RulesPane session={session} />
      </main>
    </div>
  );
}
