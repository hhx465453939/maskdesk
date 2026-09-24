/** 全局共享类型（单一来源；main 与 renderer 均 import type，编译期擦除） */

export type DocKind = 'docx' | 'pdf' | 'md' | 'txt';
export type DocStatus = 'pending' | 'converting' | 'ready' | 'failed';

/** 文档项（SPEC §4 数据契约） */
export interface DocItem {
  id: string;
  name: string;
  kind: DocKind;
  size: number;
  status: DocStatus;
  /** 原始文件副本路径（userData/imports/<sessionId>/ 内，纯本地） */
  rawPath?: string;
  /** 转换后的原始 Markdown（脱敏视图 = f(originalMarkdown, rules)，永不被改写） */
  originalMarkdown?: string;
  error?: string;
}

export type RuleType = 'literal' | 'regex';
export type RuleTag = '姓名' | '电话' | '日期' | '住院号' | '身份证' | '自定义';

/** 脱敏规则 */
export interface Rule {
  id: string;
  tag: RuleTag;
  ruleType: RuleType;
  pattern: string;
  replacementToken: string;
  enabled: boolean;
  createdAt: string;
}

/** 映射记录：applyRules 计算时聚合生成（原文 ↔ 占位符 ↔ 文档，可反向追溯） */
export interface Mapping {
  ruleId: string;
  docId: string;
  original: string;
  replacement: string;
  count: number;
}

/** 工作会话 */
export interface Session {
  id: string;
  name: string;
  docs: DocItem[];
  rules: Rule[];
  mappings: Mapping[];
  version: 1;
  createdAt: string;
  updatedAt: string;
}

export interface SessionIndexItem {
  id: string;
  name: string;
  updatedAt: string;
}

export interface AppInfo {
  version: string;
  productName: string;
}
