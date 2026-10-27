// Presentation copy for the current Chinese interface; machine identifiers stay unchanged.
export const readerCopy = {
  nav: { intel: '每日情报', overview: '行情概览', workspace: '日内工作台', research: '策略研究', agent: '纸面交易' },
  actions: { overview: '查看行情概览', workspace: '打开日内工作台', research: '查看策略研究', agent: '查看纸面交易' },
  technicalDetails: '数据来源与技术详情',
  missingMarket: '尚未发布市场状态分析，请先查看已有的行情快照。',
  invalidMarket: '市场状态数据未通过校验，暂时无法展示。',
  contextTitle: '行情条件与研究结果',
  missingContext: '当前快照还没有行情条件分析。',
  invalidContext: '行情条件分析未通过校验，暂时无法展示。',
  loadingNote: '正在读取每日短评。',
  missingTime: '未提供', dateOnly: '未提供时刻', timezone: '北京时间',
};

export function formatSourceTime(value: string | null): string {
  if (!value) return readerCopy.missingTime;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}（${readerCopy.dateOnly}）`;
  // An unzoned value cannot be safely converted to a different time zone.
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}（${readerCopy.timezone}）`;
}
