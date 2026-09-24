import type { RuleTag } from './types';

/** 内置启发式识别器（SPEC M4：首批 8 类 + 可扩展注册表） */
export interface Detector {
  id: string;
  label: string;
  tag: RuleTag;
  regex: string;
  token: string;
  enabledByDefault: boolean;
}

export const DETECTORS: Detector[] = [
  { id: 'det-mobile', label: '手机号', tag: '电话', regex: '1[3-9]\\d{9}', token: '[电话_手机]', enabledByDefault: true },
  { id: 'det-idcard', label: '身份证号', tag: '身份证', regex: '\\d{17}[\\dXx]', token: '[身份证_1]', enabledByDefault: true },
  { id: 'det-email', label: '邮箱', tag: '自定义', regex: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', token: '[邮箱_1]', enabledByDefault: true },
  { id: 'det-date', label: '日期', tag: '日期', regex: '\\d{4}[-/年]\\d{1,2}[-/月]\\d{1,2}日?', token: '[日期_1]', enabledByDefault: true },
  { id: 'det-landline', label: '固定电话', tag: '电话', regex: '0\\d{2,3}-?\\d{7,8}', token: '[电话_固话]', enabledByDefault: false },
  { id: 'det-url', label: 'URL', tag: '自定义', regex: 'https?://\\S+', token: '[链接_1]', enabledByDefault: false },
  { id: 'det-casenumber', label: '数字编号串', tag: '住院号', regex: '\\b\\d{6,12}\\b', token: '[编号_1]', enabledByDefault: true },
  { id: 'det-bankcard', label: '银行卡号', tag: '自定义', regex: '\\b\\d{13,19}\\b', token: '[银行卡_1]', enabledByDefault: false },
];
