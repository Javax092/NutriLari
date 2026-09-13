import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateLeadEvents, getDateRange, parseLeadEventPayload, parsePeriod, type LeadEvent } from '../lib/lead-events.ts'

test('API payload válido', () => {
  const result = parseLeadEventPayload({ sessionId: 'session-123', eventType: 'PAGE_VIEW', source: 'instagram' })
  assert.equal(result.ok, true)
})

test('API rejeita payload inválido, eventType inválido e strings grandes', () => {
  assert.equal(parseLeadEventPayload(null).ok, false)
  assert.equal(parseLeadEventPayload({ sessionId: 'session-123', eventType: 'BOOKED' }).ok, false)
  assert.equal(parseLeadEventPayload({ sessionId: 'session-123', eventType: 'PAGE_VIEW', source: 'x'.repeat(181) }).ok, false)
  assert.equal(parseLeadEventPayload({ sessionId: 'session-123', eventType: 'PAGE_VIEW', extra: true }).ok, false)
})

test('analytics conta sessões únicas, cliques, conversão e agrupamentos', () => {
  const events: LeadEvent[] = [
    event('1', 'a', 'PAGE_VIEW', 'instagram', 'campanha_a'),
    event('2', 'a', 'PAGE_VIEW', 'instagram', 'campanha_a'),
    event('3', 'a', 'WHATSAPP_CLICK', 'instagram', 'campanha_a', 'story_01'),
    event('7', 'a', 'WHATSAPP_CLICK', 'instagram', 'campanha_a', 'story_01'),
    event('4', 'b', 'PAGE_VIEW', 'google', 'campanha_b'),
    event('5', 'c', 'PAGE_VIEW', undefined, undefined),
    event('6', 'c', 'WHATSAPP_CLICK', undefined, undefined),
  ]
  const data = aggregateLeadEvents(events, getDateRange('7d'))
  assert.equal(data.summary.visitors, 3)
  assert.equal(data.summary.pageViews, 4)
  assert.equal(data.summary.whatsappClicks, 3)
  assert.equal(data.summary.conversionRate, 66.7)
  assert.equal(data.sources.find(row => row.label === 'Instagram')?.whatsappClicks, 1)
  assert.equal(data.sources.find(row => row.label === 'Instagram')?.conversionRate, 100)
  assert.equal(data.campaigns.find(row => row.label === 'campanha_a')?.visitors, 1)
  assert.equal(data.campaigns.find(row => row.label === 'campanha_a')?.whatsappClicks, 1)
  assert.equal(data.contents.find(row => row.label === 'story_01')?.visitors, 1)
  assert.equal(data.contents.find(row => row.label === 'story_01')?.whatsappClicks, 1)
})

test('analytics calcula funil do diagnóstico', () => {
  const events: LeadEvent[] = [
    event('1', 'a', 'PAGE_VIEW'),
    event('2', 'a', 'DIAGNOSTIC_STARTED'),
    event('3', 'a', 'DIAGNOSTIC_COMPLETED'),
    event('4', 'a', 'WHATSAPP_CLICK'),
    event('5', 'b', 'PAGE_VIEW'),
    event('6', 'b', 'DIAGNOSTIC_STARTED'),
  ]
  const data = aggregateLeadEvents(events, getDateRange('7d'))
  assert.equal(data.summary.diagnosticStarted, 2)
  assert.equal(data.summary.diagnosticCompleted, 1)
  assert.equal(data.summary.diagnosticStartRate, 100)
  assert.equal(data.summary.diagnosticCompletionRate, 50)
  assert.equal(data.summary.whatsappAfterDiagnosticRate, 100)
})

test('analytics em período sem dados retorna vazio amigável', () => {
  const old = event('1', 'a', 'PAGE_VIEW', 'instagram', 'x')
  old.createdAt = '2020-01-01T00:00:00.000Z'
  const data = aggregateLeadEvents([old], getDateRange('today'))
  assert.equal(data.summary.visitors, 0)
  assert.equal(data.sources.length, 0)
  assert.equal(data.insights[0].warning, true)
})

test('range today considera somente eventos de hoje', () => {
  const data = aggregateLeadEvents([event('1', 'a', 'PAGE_VIEW'), event('2', 'b', 'PAGE_VIEW', undefined, undefined, undefined, daysAgo(1))], getDateRange('today'))
  assert.equal(data.summary.visitors, 1)
})

test('range 7d inclui sete dias e exclui evento de oito dias atrás', () => {
  const data = aggregateLeadEvents([event('1', 'a', 'PAGE_VIEW', undefined, undefined, undefined, daysAgo(6)), event('2', 'b', 'PAGE_VIEW', undefined, undefined, undefined, daysAgo(7))], getDateRange('7d'))
  assert.equal(data.summary.visitors, 1)
  assert.equal(data.daily.length, 7)
})

test('range 30d inclui trinta dias e exclui evento de trinta e um dias atrás', () => {
  const data = aggregateLeadEvents([event('1', 'a', 'PAGE_VIEW', undefined, undefined, undefined, daysAgo(29)), event('2', 'b', 'PAGE_VIEW', undefined, undefined, undefined, daysAgo(30))], getDateRange('30d'))
  assert.equal(data.summary.visitors, 1)
  assert.equal(data.daily.length, 30)
})

test('range inválido usa 7d', () => {
  assert.equal(parsePeriod('banana'), '7d')
  assert.equal(parsePeriod(undefined), '7d')
})

test('conversão com zero visitantes não gera NaN', () => {
  const data = aggregateLeadEvents([], getDateRange('7d'))
  assert.equal(data.summary.conversionRate, 0)
})

test('agrupa por source, campaign e content com fallbacks', () => {
  const events = [
    event('1', 'a', 'PAGE_VIEW', 'instagram', 'teste_admin', 'story_01'),
    event('2', 'a', 'WHATSAPP_CLICK', 'instagram', 'teste_admin', 'story_01'),
    event('3', 'b', 'PAGE_VIEW'),
    event('4', 'b', 'WHATSAPP_CLICK'),
  ]
  const data = aggregateLeadEvents(events, getDateRange('7d'))
  assert.equal(data.sources.find(row => row.label === 'Instagram')?.visitors, 1)
  assert.equal(data.sources.find(row => row.label === 'Acesso direto')?.whatsappClicks, 1)
  assert.equal(data.campaigns.find(row => row.label === 'teste_admin')?.conversionRate, 100)
  assert.equal(data.campaigns.find(row => row.label === 'Sem campanha')?.visitors, 1)
  assert.equal(data.contents.find(row => row.label === 'story_01')?.whatsappClicks, 1)
  assert.equal(data.contents.find(row => row.label === 'Sem identificação')?.visitors, 1)
})

function event(id: string, sessionId: string, eventType: LeadEvent['eventType'], source?: string, campaign?: string, content?: string, createdAt = new Date()): LeadEvent {
  return { id, sessionId, eventType, source, campaign, content, createdAt: createdAt.toISOString() }
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}
