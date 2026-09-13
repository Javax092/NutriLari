import { siteConfig, type PreConsultationAnswers } from './site-config.ts'

export type AcquisitionContext = {
  sessionId: string
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  landingPage?: string
  currentPage?: string
  referrer?: string
}

const storageKey = 'larissa.acquisition'
const pageViewKey = 'larissa.pageview.sent'
const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const defaultMessage = 'Oi, Larissa. Vi seu site e gostaria de entender melhor meu caso.'

export function getSessionId(storage = sessionStorage) {
  const existing = storage.getItem('larissa.sessionId')
  if (existing) return existing
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  storage.setItem('larissa.sessionId', id)
  return id
}

export function getAcquisitionContext(): AcquisitionContext {
  const stored = readStoredContext()
  const params = new URLSearchParams(window.location.search)
  const updates: Partial<AcquisitionContext> = {}
  const [source, medium, campaign, content, term] = utmKeys.map(key => params.get(key)?.trim() || undefined)
  if (source) updates.source = source
  if (medium) updates.medium = medium
  if (campaign) updates.campaign = campaign
  if (content) updates.content = content
  if (term) updates.term = term
  const context: AcquisitionContext = {
    ...stored,
    ...updates,
    sessionId: getSessionId(),
    landingPage: stored.landingPage || window.location.pathname,
    currentPage: window.location.pathname,
    referrer: stored.referrer || document.referrer || undefined,
  }
  sessionStorage.setItem(storageKey, JSON.stringify(context))
  return context
}

export function buildTrackedWhatsAppMessage(context: Partial<AcquisitionContext> = {}, message = defaultMessage) {
  const parts = []
  if (context.source) parts.push(`Origem: ${friendlySource(context.source)}`)
  if (context.campaign) parts.push(`Campanha: ${context.campaign}`)
  return parts.length ? `${message}\n\n${parts.join(' | ')}` : message
}

export function getTrackedWhatsAppUrl(context = getAcquisitionContext(), message?: string) {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(buildTrackedWhatsAppMessage(context, message))}`
}

export function sendLeadEvent(eventType: 'PAGE_VIEW' | 'DIAGNOSTIC_STARTED' | 'DIAGNOSTIC_COMPLETED' | 'WHATSAPP_CLICK', context = getAcquisitionContext()) {
  return fetch('/api/lead-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...context, eventType }),
    keepalive: true,
  }).catch(() => undefined)
}

export function trackPageViewOnce() {
  const key = `${pageViewKey}:${window.location.pathname}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  void sendLeadEvent('PAGE_VIEW')
}

export function trackAndOpenWhatsApp(message?: string, content?: string) {
  const context = { ...getAcquisitionContext(), ...(content ? { content } : {}) }
  const url = getTrackedWhatsAppUrl(context, message)
  window.open(url, '_blank', 'noopener,noreferrer')
  void sendLeadEvent('WHATSAPP_CLICK', context)
}

export function trackDiagnosticStarted(content?: string) {
  void sendLeadEvent('DIAGNOSTIC_STARTED', { ...getAcquisitionContext(), ...(content ? { content } : {}) })
}

export function trackDiagnosticCompleted(content?: string) {
  void sendLeadEvent('DIAGNOSTIC_COMPLETED', { ...getAcquisitionContext(), ...(content ? { content } : {}) })
}

export function buildQualifiedTrackedMessage(answers: PreConsultationAnswers) {
  const clean = (value: string) => value.trim().replace(/[.!?]+$/, '')
  return `Oi, Larissa. Conheci seu trabalho pelo site e gostaria de entender melhor meu caso.

Meu objetivo:
${clean(answers.goal)}

Hoje me identifico mais com:
${clean(answers.situation)}.

Minha principal dificuldade:
${clean(answers.obstacle)}.

Pretendo começar:
${clean(answers.startTiming)}.

Gostaria de entender qual acompanhamento faria mais sentido para mim.`
}

function readStoredContext() {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) || '{}') as Partial<AcquisitionContext>
  } catch {
    return {}
  }
}

function friendlySource(source: string) {
  const known: Record<string, string> = {
    direct: 'Acesso direto',
    facebook: 'Facebook',
    google: 'Google',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
  }
  return known[source.toLowerCase()] ?? source.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}
