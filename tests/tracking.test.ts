import assert from 'node:assert/strict'
import test from 'node:test'
import { buildQualifiedTrackedMessage, buildTrackedWhatsAppMessage, getAcquisitionContext, getSessionId, getTrackedWhatsAppUrl, trackAndOpenWhatsApp, trackDiagnosticCompleted, trackDiagnosticStarted } from '../lib/tracking.ts'

test('tracking sem UTM cria sessionId e preserva página/referrer', () => {
  mockBrowser('https://site.test/')
  const context = getAcquisitionContext()
  assert.ok(context.sessionId)
  assert.equal(context.landingPage, '/')
  assert.equal(context.currentPage, '/')
  assert.equal(context.source, undefined)
})

test('tracking com UTM completa e incompleta persiste sem sobrescrever com vazio', () => {
  const storage = mockBrowser('https://site.test/?utm_source=instagram&utm_medium=organic&utm_campaign=larissa_setembro&utm_content=story_01&utm_term=nutri')
  const first = getAcquisitionContext()
  assert.equal(first.source, 'instagram')
  assert.equal(first.medium, 'organic')
  assert.equal(first.campaign, 'larissa_setembro')
  assert.equal(first.content, 'story_01')
  assert.equal(first.term, 'nutri')

  mockBrowser('https://site.test/?utm_source=', storage)
  const second = getAcquisitionContext()
  assert.equal(second.source, 'instagram')
  assert.equal(second.campaign, 'larissa_setembro')
})

test('sessionId é estável na sessão', () => {
  const storage = mockBrowser('https://site.test/')
  assert.equal(getSessionId(storage), getSessionId(storage))
})

test('mensagem e URL do WhatsApp são amigáveis e encoded', () => {
  assert.equal(buildTrackedWhatsAppMessage(), 'Oi, Larissa. Vi seu site e gostaria de entender melhor meu caso.')
  assert.match(buildTrackedWhatsAppMessage({ source: 'instagram' }), /Origem: Instagram/)
  assert.match(buildTrackedWhatsAppMessage({ source: 'instagram', campaign: 'larissa_setembro' }), /Origem: Instagram \| Campanha: larissa_setembro/)
  mockBrowser('https://site.test/?utm_source=instagram')
  assert.match(getTrackedWhatsAppUrl(), /^https:\/\/wa\.me\/5592994615755\?text=/)
  assert.match(decodeURIComponent(getTrackedWhatsAppUrl()), /Origem: Instagram/)
})

test('falha de tracking não impede abertura do WhatsApp', () => {
  mockBrowser('https://site.test/?utm_source=instagram')
  let opened = ''
  globalThis.fetch = (() => Promise.reject(new Error('down'))) as typeof fetch
  globalThis.window.open = (url: string | URL | undefined) => {
    opened = String(url)
    return null
  }
  trackAndOpenWhatsApp()
  assert.match(opened, /wa\.me/)
})

test('clique no WhatsApp pode identificar CTA sem apagar UTM', () => {
  mockBrowser('https://site.test/?utm_source=instagram&utm_content=story_01')
  let payload = ''
  globalThis.fetch = ((_, init) => {
    payload = String(init?.body)
    return Promise.resolve(new Response('{}'))
  }) as typeof fetch

  trackAndOpenWhatsApp(undefined, 'hero_understand_case')

  const event = JSON.parse(payload)
  assert.equal(event.source, 'instagram')
  assert.equal(event.content, 'hero_understand_case')
})

test('diagnóstico registra origem e mensagem final contém respostas', () => {
  mockBrowser('https://site.test/?utm_source=instagram&utm_content=story_01')
  const payloads: string[] = []
  let opened = ''
  globalThis.fetch = ((_, init) => {
    payloads.push(String(init?.body))
    return Promise.resolve(new Response('{}'))
  }) as typeof fetch
  globalThis.window.open = (url: string | URL | undefined) => {
    opened = String(url)
    return null
  }

  trackDiagnosticStarted('hero_understand_case')
  trackDiagnosticCompleted('hero_understand_case')
  trackAndOpenWhatsApp(buildQualifiedTrackedMessage({
    goal: 'Emagrecimento',
    situation: 'Sei o que preciso fazer, mas tenho dificuldade em manter',
    obstacle: 'Minha rotina de trabalho muda muito.',
    startTiming: 'Nas próximas semanas',
  }), 'hero_understand_case')

  assert.equal(JSON.parse(payloads[0]).eventType, 'DIAGNOSTIC_STARTED')
  assert.equal(JSON.parse(payloads[1]).eventType, 'DIAGNOSTIC_COMPLETED')
  assert.equal(JSON.parse(payloads[2]).eventType, 'WHATSAPP_CLICK')
  assert.equal(JSON.parse(payloads[2]).content, 'hero_understand_case')
  assert.match(decodeURIComponent(opened), /Minha rotina de trabalho muda muito/)
})

function mockBrowser(url: string, existingStorage = memoryStorage()) {
  globalThis.sessionStorage = existingStorage as Storage
  globalThis.document = { referrer: 'https://referrer.test/post' } as Document
  globalThis.window = {
    location: new URL(url),
    open: () => null,
  } as unknown as Window & typeof globalThis
  globalThis.fetch = (() => Promise.resolve(new Response('{}'))) as typeof fetch
  return existingStorage
}

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size },
  }
}
