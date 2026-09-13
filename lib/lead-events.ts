import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const eventTypes = ['PAGE_VIEW', 'DIAGNOSTIC_STARTED', 'DIAGNOSTIC_COMPLETED', 'WHATSAPP_CLICK'] as const
export type LeadEventType = (typeof eventTypes)[number]
export type LeadEventInput = {
  sessionId: string
  eventType: LeadEventType
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  landingPage?: string
  currentPage?: string
  referrer?: string
}
export type LeadEvent = LeadEventInput & { id: string; createdAt: string }
export type PeriodKey = 'today' | '7d' | '30d'
export type DateRange = { start: Date; end: Date }
export type AnalyticsRow = { label: string; visitors: number; whatsappClicks: number; conversionRate: number }
export type DailyRow = { date: string; visitors: number; whatsappClicks: number }
export type AnalyticsData = {
  summary: { visitors: number; pageViews: number; diagnosticStarted: number; diagnosticCompleted: number; whatsappClicks: number; conversionRate: number; diagnosticStartRate: number; diagnosticCompletionRate: number; whatsappAfterDiagnosticRate: number }
  sources: AnalyticsRow[]
  campaigns: AnalyticsRow[]
  contents: AnalyticsRow[]
  daily: DailyRow[]
  insights: { text: string; warning?: boolean }[]
}

const maxLength = 180
const keys = ['sessionId', 'eventType', 'source', 'medium', 'campaign', 'content', 'term', 'landingPage', 'currentPage', 'referrer'] as const
const optionalKeys = keys.filter(key => key !== 'sessionId' && key !== 'eventType')
export function parseLeadEventPayload(payload: unknown): { ok: true; data: LeadEventInput } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { ok: false, error: 'Payload inválido.' }
  const input = payload as Record<string, unknown>
  const extra = Object.keys(input).find(key => !keys.includes(key as (typeof keys)[number]))
  if (extra) return { ok: false, error: 'Payload contém campos não aceitos.' }
  if (typeof input.sessionId !== 'string' || input.sessionId.trim().length < 8 || input.sessionId.length > 80) return { ok: false, error: 'sessionId inválido.' }
  if (!eventTypes.includes(input.eventType as LeadEventType)) return { ok: false, error: 'eventType inválido.' }

  const data: LeadEventInput = { sessionId: input.sessionId.trim(), eventType: input.eventType as LeadEventType }
  for (const key of optionalKeys) {
    const value = input[key]
    if (value == null || value === '') continue
    if (typeof value !== 'string') return { ok: false, error: `${key} inválido.` }
    const clean = value.trim()
    if (clean.length > maxLength) return { ok: false, error: `${key} excede ${maxLength} caracteres.` }
    data[key] = clean
  }
  return { ok: true, data }
}

export function parsePeriod(value: string | null | undefined): PeriodKey {
  return value === 'today' || value === '30d' || value === '7d' ? value : '7d'
}

export function getDateRange(period: string | null | undefined): DateRange {
  const end = new Date()
  const start = new Date(end)
  start.setHours(0, 0, 0, 0)
  if (period === 'today') return { start, end }
  start.setDate(start.getDate() - (period === '30d' ? 29 : 6))
  return { start, end }
}

export function friendlyValue(value: string | undefined, fallback: string) {
  if (!value) return fallback
  const known: Record<string, string> = {
    direct: 'Acesso direto',
    facebook: 'Facebook',
    google: 'Google',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
  }
  return known[value.toLowerCase()] ?? value.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

export function aggregateLeadEvents(events: LeadEvent[], range: DateRange): AnalyticsData {
  const filtered = events.filter(event => {
    const createdAt = new Date(event.createdAt)
    return createdAt >= range.start && createdAt <= range.end
  })
  if (!filtered.length) return emptyData(range)

  const summary = getAnalyticsSummary(filtered)
  const sources = getAnalyticsBySource(filtered)
  const campaigns = getAnalyticsByCampaign(filtered)
  const contents = getAnalyticsByContent(filtered)

  return { summary, sources, campaigns, contents, daily: getDailyAnalytics(filtered, range), insights: buildInsights(summary, sources, campaigns, contents) }
}

export function getAnalyticsSummary(events: LeadEvent[]) {
  const visitors = new Set(events.map(event => event.sessionId))
  const clickSessions = new Set(events.filter(event => event.eventType === 'WHATSAPP_CLICK').map(event => event.sessionId))
  const diagnosticStartSessions = new Set(events.filter(event => event.eventType === 'DIAGNOSTIC_STARTED').map(event => event.sessionId))
  const diagnosticCompleteSessions = new Set(events.filter(event => event.eventType === 'DIAGNOSTIC_COMPLETED').map(event => event.sessionId))
  const pageViewSessions = new Set(events.filter(event => event.eventType === 'PAGE_VIEW').map(event => event.sessionId))
  const diagnosticStarted = events.filter(event => event.eventType === 'DIAGNOSTIC_STARTED').length
  const diagnosticCompleted = events.filter(event => event.eventType === 'DIAGNOSTIC_COMPLETED').length
  return {
    visitors: visitors.size,
    pageViews: events.filter(event => event.eventType === 'PAGE_VIEW').length,
    diagnosticStarted,
    diagnosticCompleted,
    whatsappClicks: events.filter(event => event.eventType === 'WHATSAPP_CLICK').length,
    conversionRate: rate(clickSessions.size, visitors.size),
    diagnosticStartRate: rate(diagnosticStartSessions.size, pageViewSessions.size),
    diagnosticCompletionRate: rate(diagnosticCompleteSessions.size, diagnosticStartSessions.size),
    whatsappAfterDiagnosticRate: rate(clickSessions.size, diagnosticCompleteSessions.size),
  }
}

export function getDailyAnalytics(events: LeadEvent[], range: DateRange): DailyRow[] {
  const days = new Map<string, { visitors: Set<string>; clicks: Set<string> }>()
  for (const date = new Date(range.start); date <= range.end; date.setDate(date.getDate() + 1)) {
    days.set(dateKey(date), { visitors: new Set<string>(), clicks: new Set<string>() })
  }
  for (const event of events) {
    const label = dateKey(new Date(event.createdAt))
    const day = days.get(label)
    if (!day) continue
    day.visitors.add(event.sessionId)
    if (event.eventType === 'WHATSAPP_CLICK') day.clicks.add(event.sessionId)
  }
  return [...days.entries()].map(([date, day]) => ({ date, visitors: day.visitors.size, whatsappClicks: day.clicks.size }))
}

export function getAnalyticsBySource(events: LeadEvent[]) {
  return groupRows(events, event => friendlyValue(event.source, 'Acesso direto'))
}

export function getAnalyticsByCampaign(events: LeadEvent[]) {
  return groupRows(events, event => event.campaign || 'Sem campanha')
}

export function getAnalyticsByContent(events: LeadEvent[]) {
  return groupRows(events, event => event.content || 'Sem identificação')
}

export async function createLeadEvent(input: LeadEventInput) {
  const event = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  await writeSqliteEvent(event)
  return event.id
}

export async function getAnalytics(range: DateRange) {
  return aggregateLeadEvents(await readEvents(range), range)
}

function rate(part: number, total: number) {
  return total ? Math.round((part / total) * 1000) / 10 : 0
}

function groupRows(events: LeadEvent[], labelFor: (event: LeadEvent) => string) {
  const groups = new Map<string, { visitors: Set<string>; clicks: Set<string> }>()
  for (const event of events) {
    const label = labelFor(event)
    const group = groups.get(label) ?? { visitors: new Set<string>(), clicks: new Set<string>() }
    group.visitors.add(event.sessionId)
    if (event.eventType === 'WHATSAPP_CLICK') group.clicks.add(event.sessionId)
    groups.set(label, group)
  }
  return [...groups.entries()]
    .map(([label, group]) => ({ label, visitors: group.visitors.size, whatsappClicks: group.clicks.size, conversionRate: rate(group.clicks.size, group.visitors.size) }))
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks || b.visitors - a.visitors || a.label.localeCompare(b.label))
}

function buildInsights(summary: AnalyticsData['summary'], sources: AnalyticsRow[], campaigns: AnalyticsRow[], contents: AnalyticsRow[]) {
  const insights: AnalyticsData['insights'] = []
  if (summary.visitors < 30) insights.push({ text: 'Amostra pequena: os dados ainda são iniciais. Use como sinal, não como conclusão definitiva.', warning: true })
  const topSource = sources[0]
  if (topSource && summary.whatsappClicks) insights.push({ text: `${topSource.label} gerou ${rate(topSource.whatsappClicks, summary.whatsappClicks)}% dos cliques no WhatsApp no período.` })
  const campaignOptions = campaigns.filter(row => row.label !== 'Sem campanha' && row.visitors >= 5)
  const topCampaign = campaignOptions.sort((a, b) => b.conversionRate - a.conversionRate)[0]
  insights.push(topCampaign ? { text: `A campanha ${topCampaign.label} apresenta a maior taxa de conversão.` } : { text: 'Não há dados suficientes para comparar campanhas.', warning: true })
  const topContent = contents.find(row => row.label !== 'Sem identificação' && row.whatsappClicks > 0)
  if (topContent) insights.push({ text: `${topContent.label} foi o conteúdo com mais cliques no WhatsApp.` })
  return insights
}

function emptyData(range: DateRange): AnalyticsData {
  return {
    summary: { visitors: 0, pageViews: 0, diagnosticStarted: 0, diagnosticCompleted: 0, whatsappClicks: 0, conversionRate: 0, diagnosticStartRate: 0, diagnosticCompletionRate: 0, whatsappAfterDiagnosticRate: 0 },
    sources: [],
    campaigns: [],
    contents: [],
    daily: getDailyAnalytics([], range),
    insights: [{ text: 'Ainda não há dados suficientes para conclusões confiáveis.', warning: true }],
  }
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dbPath() {
  return process.env.LEAD_EVENTS_DB_PATH || join(process.cwd(), 'data', 'lead-events.sqlite')
}

async function openDb() {
  const path = dbPath()
  const { DatabaseSync } = await import('node:sqlite')
  const db = new DatabaseSync(path)
  db.exec(`CREATE TABLE IF NOT EXISTS lead_events (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    eventType TEXT NOT NULL CHECK (eventType IN ('PAGE_VIEW', 'DIAGNOSTIC_STARTED', 'DIAGNOSTIC_COMPLETED', 'WHATSAPP_CLICK')),
    source TEXT,
    medium TEXT,
    campaign TEXT,
    content TEXT,
    term TEXT,
    landingPage TEXT,
    currentPage TEXT,
    referrer TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lead_events_createdAt ON lead_events(createdAt);
  CREATE INDEX IF NOT EXISTS idx_lead_events_sessionId ON lead_events(sessionId);
  CREATE INDEX IF NOT EXISTS idx_lead_events_eventType ON lead_events(eventType);
  CREATE INDEX IF NOT EXISTS idx_lead_events_source ON lead_events(source);
  CREATE INDEX IF NOT EXISTS idx_lead_events_campaign ON lead_events(campaign);`)
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'lead_events'").get() as { sql?: string } | undefined
  if (schema?.sql && !schema.sql.includes('DIAGNOSTIC_STARTED')) {
    db.exec(`ALTER TABLE lead_events RENAME TO lead_events_old;
    CREATE TABLE lead_events (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      eventType TEXT NOT NULL CHECK (eventType IN ('PAGE_VIEW', 'DIAGNOSTIC_STARTED', 'DIAGNOSTIC_COMPLETED', 'WHATSAPP_CLICK')),
      source TEXT,
      medium TEXT,
      campaign TEXT,
      content TEXT,
      term TEXT,
      landingPage TEXT,
      currentPage TEXT,
      referrer TEXT,
      createdAt TEXT NOT NULL
    );
    INSERT INTO lead_events SELECT * FROM lead_events_old;
    DROP TABLE lead_events_old;
    CREATE INDEX IF NOT EXISTS idx_lead_events_createdAt ON lead_events(createdAt);
    CREATE INDEX IF NOT EXISTS idx_lead_events_sessionId ON lead_events(sessionId);
    CREATE INDEX IF NOT EXISTS idx_lead_events_eventType ON lead_events(eventType);
    CREATE INDEX IF NOT EXISTS idx_lead_events_source ON lead_events(source);
    CREATE INDEX IF NOT EXISTS idx_lead_events_campaign ON lead_events(campaign);`)
  }
  return db
}

async function writeSqliteEvent(event: LeadEvent) {
  const path = dbPath()
  mkdirSync(dirname(path), { recursive: true })
  const db = await openDb()
  db.prepare(`INSERT INTO lead_events (id, sessionId, eventType, source, medium, campaign, content, term, landingPage, currentPage, referrer, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(event.id, event.sessionId, event.eventType, event.source ?? null, event.medium ?? null, event.campaign ?? null, event.content ?? null, event.term ?? null, event.landingPage ?? null, event.currentPage ?? null, event.referrer ?? null, event.createdAt)
  db.close()
}

async function readEvents(range: DateRange): Promise<LeadEvent[]> {
  const db = await openDb()
  const rows = db.prepare('SELECT * FROM lead_events WHERE createdAt >= ? AND createdAt <= ?').all(range.start.toISOString(), range.end.toISOString()) as LeadEvent[]
  db.close()
  return rows
}
