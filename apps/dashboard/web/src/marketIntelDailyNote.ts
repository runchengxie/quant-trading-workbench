export const MARKET_INTEL_PAGES_BASE_URL = 'https://runchengxie.github.io/market-intel-pages';
export const MARKET_INTEL_DAILY_SUMMARIES_URL = `${MARKET_INTEL_PAGES_BASE_URL}/data/daily_summaries.json`;
export const MARKET_INTEL_REPORTS_URL = `${MARKET_INTEL_PAGES_BASE_URL}/data/reports.json`;

const SUMMARY_SCHEMA = 'market_intel_pages.daily_summaries.v1';
const REPORT_SCHEMA = 'market_intel_pages.reports.v1';

export interface MarketIntelDailyNote {
  date: string;
  text: string;
  morningReportId: string;
  eveningReportId: string;
  generatedAt: string;
  model: string;
  promptVersion: string;
}

export type MarketIntelDailyNoteResult =
  | { status: 'available'; note: MarketIntelDailyNote }
  | { status: 'loading' | 'missing' | 'invalid' | 'error' };

interface ReportRecord {
  id: string;
  date: string;
  kind: string;
  generatedAt: number | null;
}

interface SummaryRecord {
  date: string;
  text: string;
  morning_report_id: string;
  evening_report_id: string;
  generated_at: string;
  model: string;
  prompt_version: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function reportGeneratedAt(value: Record<string, unknown>): number | null {
  if (!Array.isArray(value.sections)) return null;
  for (const section of value.sections) {
    if (!isRecord(section) || !Array.isArray(section.paragraphs)) continue;
    for (const paragraph of section.paragraphs) {
      if (typeof paragraph !== 'string') continue;
      const match = paragraph.match(/^生成时间:\s*(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/);
      if (!match) continue;
      const timestamp = Date.parse(`${match[1]}T${match[2]}:00+08:00`);
      if (!Number.isNaN(timestamp)) return timestamp;
    }
  }
  return null;
}

function asReport(value: unknown): ReportRecord | null {
  if (!isRecord(value)
    || !isText(value.id)
    || !isDate(value.date)
    || (value.kind !== 'morning' && value.kind !== 'evening')) return null;
  return {
    id: value.id,
    date: value.date,
    kind: value.kind,
    generatedAt: reportGeneratedAt(value),
  };
}

function asSummary(value: unknown): SummaryRecord | null {
  if (!isRecord(value)
    || !isDate(value.date)
    || !isText(value.text)
    || !isText(value.morning_report_id)
    || !isText(value.evening_report_id)
    || !isText(value.generated_at)
    || Number.isNaN(Date.parse(value.generated_at))
    || !isText(value.model)
    || !isText(value.prompt_version)) return null;
  return {
    date: value.date,
    text: value.text.trim(),
    morning_report_id: value.morning_report_id,
    evening_report_id: value.evening_report_id,
    generated_at: value.generated_at,
    model: value.model,
    prompt_version: value.prompt_version,
  };
}

export function parseMarketIntelDailyNote(
  reportsPayload: unknown,
  summariesPayload: unknown,
): MarketIntelDailyNoteResult {
  if (!isRecord(reportsPayload)
    || reportsPayload.schema_version !== REPORT_SCHEMA
    || !Array.isArray(reportsPayload.reports)
    || !isRecord(summariesPayload)
    || summariesPayload.schema_version !== SUMMARY_SCHEMA
    || !Array.isArray(summariesPayload.summaries)) return { status: 'invalid' };

  const reports = reportsPayload.reports.map(asReport);
  if (reports.some((report) => report === null)) return { status: 'invalid' };

  const summaries = summariesPayload.summaries;
  if (summaries.length === 0) return { status: 'missing' };
  const summaryRecords = summaries.map(asSummary);
  if (summaryRecords.some((summary) => summary === null)) return { status: 'invalid' };
  const summary = (summaryRecords as SummaryRecord[]).sort((left, right) => (
    right.date.localeCompare(left.date)
    || Date.parse(right.generated_at) - Date.parse(left.generated_at)
  ))[0];

  const reportsById = new Map((reports as ReportRecord[]).map((report) => [report.id, report]));
  const morning = reportsById.get(summary.morning_report_id);
  const evening = reportsById.get(summary.evening_report_id);
  if (!morning || !evening
    || morning.kind !== 'morning'
    || evening.kind !== 'evening'
    || morning.date !== summary.date
    || evening.date > morning.date
    || morning.generatedAt === null
    || evening.generatedAt === null
    || evening.generatedAt >= morning.generatedAt) return { status: 'invalid' };

  return {
    status: 'available',
    note: {
      date: summary.date,
      text: summary.text,
      morningReportId: summary.morning_report_id,
      eveningReportId: summary.evening_report_id,
      generatedAt: summary.generated_at,
      model: summary.model,
      promptVersion: summary.prompt_version,
    },
  };
}

export async function loadMarketIntelDailyNote(
  fetcher: typeof fetch = fetch,
): Promise<MarketIntelDailyNoteResult> {
  let responses: [Response, Response];
  try {
    responses = await Promise.all([
      fetcher(MARKET_INTEL_REPORTS_URL, { cache: 'no-store' }),
      fetcher(MARKET_INTEL_DAILY_SUMMARIES_URL, { cache: 'no-store' }),
    ]);
  } catch {
    return { status: 'error' };
  }

  if (responses.some((response) => response.status === 404)) return { status: 'missing' };
  if (responses.some((response) => !response.ok)) return { status: 'error' };

  try {
    const [reportsPayload, summariesPayload] = await Promise.all(responses.map((response) => response.json()));
    return parseMarketIntelDailyNote(reportsPayload, summariesPayload);
  } catch {
    return { status: 'invalid' };
  }
}
