'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react'
import type { PreConsultationAnswers } from '@/lib/site-config'
import { buildQualifiedTrackedMessage, trackAndOpenWhatsApp, trackDiagnosticCompleted, trackDiagnosticStarted } from '@/lib/tracking'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { cn } from '@/lib/utils'

type OptionStepKey = Extract<keyof PreConsultationAnswers, 'goal' | 'situation' | 'startTiming'>
type OptionStep = { key: OptionStepKey; question: string; options: string[] }

const optionSteps: Record<number, OptionStep> = {
  0: { key: 'goal', question: 'Qual é seu principal objetivo?', options: ['Emagrecimento', 'Melhorar minha alimentação', 'Ter mais organização', 'Outro'] },
  1: {
    key: 'situation',
    question: 'Qual situação mais se aproxima do seu momento atual?',
    options: [
      'Sei o que preciso fazer, mas tenho dificuldade em manter',
      'Já tentei dietas diferentes e voltei ao ponto inicial',
      'Minha rotina dificulta qualquer planejamento',
      'Estou começando agora e preciso de orientação',
    ],
  },
  3: { key: 'startTiming', question: 'Como está sua prioridade para começar?', options: ['Quero começar agora', 'Quero começar nas próximas semanas', 'Ainda estou conhecendo'] },
}

const totalSteps = 4
const initialAnswers: PreConsultationAnswers = { goal: '', situation: '', obstacle: '', startTiming: '' }

export function PreConsultation() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const obstacleRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [sectionVisible, setSectionVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<PreConsultationAnswers>(initialAnswers)
  const [origin, setOrigin] = useState('diagnostic_section')
  const optionStep = optionSteps[currentStep]
  const isObstacleStep = currentStep === 2
  const selectedAnswer = optionStep ? answers[optionStep.key] : ''
  const canContinue = isObstacleStep ? answers.obstacle.trim().length > 0 : Boolean(selectedAnswer)
  const qualifiedMessage = useMemo(() => buildQualifiedTrackedMessage(answers), [answers])
  const progressValue = ((currentStep + 1) / totalSteps) * 100

  useEffect(() => {
    const update = (event: Event) => {
      const content = (event as CustomEvent<{ content?: string }>).detail?.content || 'diagnostic_cta'
      setOrigin(content)
      setOpen(true)
      setCurrentStep(0)
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      trackDiagnosticStarted(content)
      window.setTimeout(() => firstButtonRef.current?.focus(), 450)
    }
    window.addEventListener('preconsultation-start', update)
    return () => window.removeEventListener('preconsultation-start', update)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('preconsultation-visibility', { detail: { open: open || sectionVisible } }))
    return () => {
      window.dispatchEvent(new CustomEvent('preconsultation-visibility', { detail: { open: false } }))
    }
  }, [open, sectionVisible])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(([entry]) => setSectionVisible(Boolean(entry?.isIntersecting)), { threshold: 0.18 })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    window.setTimeout(() => (isObstacleStep ? obstacleRef.current : firstButtonRef.current)?.focus(), 80)
  }, [currentStep, isObstacleStep, open])

  const start = (content = 'diagnostic_section') => {
    setOrigin(content)
    setOpen(true)
    trackDiagnosticStarted(content)
  }

  const next = () => {
    if (!canContinue) return
    setCurrentStep(previous => Math.min(previous + 1, totalSteps - 1))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinue) return
    trackDiagnosticCompleted(origin)
    trackAndOpenWhatsApp(qualifiedMessage, origin)
  }

  return (
    <section ref={sectionRef} id="pre-consulta" className="scroll-mt-24 bg-secondary px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
      <SpotlightCard className="mx-auto max-w-[1200px] rounded-lg border border-primary/14 bg-background/78 p-5 shadow-[0_18px_60px_color-mix(in_oklch,var(--primary)_7%,transparent)] sm:p-7 lg:p-9">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <aside>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent">MINI DIAGNÓSTICO</span>
            <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight text-primary sm:text-6xl">Vamos entender melhor o seu momento.</h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">Algumas respostas ajudam a Larissa a conhecer sua rotina e sua principal dificuldade antes da conversa.</p>
            <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/60">Leva menos de 1 minuto.</p>
          </aside>

          {!open ? (
            <div className="self-end">
              <button type="button" onClick={() => start()} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                Começar mini diagnóstico <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="min-w-0">
              <div className="mb-7">
                <p className="font-mono text-xs font-semibold text-primary/70">{currentStep + 1} de {totalSteps}</p>
                <div className="mt-3 h-1 w-full rounded-full bg-primary/12" aria-hidden="true">
                  <div className="h-1 rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progressValue}%` }} />
                </div>
              </div>

              <div key={currentStep} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {optionStep ? (
                  <>
                    <p className="font-serif text-3xl leading-tight text-primary sm:text-4xl">{optionStep.question}</p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      {optionStep.options.map((option, index) => {
                        const active = selectedAnswer === option
                        return (
                          <button
                            ref={index === 0 ? firstButtonRef : undefined}
                            type="button"
                            key={option}
                            onClick={() => setAnswers(previous => ({ ...previous, [optionStep.key]: option }))}
                            className={cn(
                              'flex min-h-12 w-full items-center gap-3 rounded-md border border-primary/15 bg-background px-4 py-3 text-left text-base leading-6 text-primary transition-colors hover:border-accent hover:bg-background/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring',
                              active && 'border-accent bg-accent/10 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent)_30%,transparent)]',
                            )}
                            aria-pressed={active}
                          >
                            <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border border-primary/35 transition-colors', active && 'border-accent')}>
                              <span className={cn('size-2 rounded-full bg-transparent transition-colors', active && 'bg-accent')} />
                            </span>
                            <span className="min-w-0 flex-1">{option}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <label htmlFor="pre-consulta-obstaculo" className="font-serif text-3xl leading-tight text-primary sm:text-4xl">O que mais dificulta sua alimentação hoje?</label>
                    <textarea
                      ref={obstacleRef}
                      id="pre-consulta-obstaculo"
                      name="obstacle"
                      value={answers.obstacle}
                      onChange={event => setAnswers(previous => ({ ...previous, obstacle: event.target.value }))}
                      rows={4}
                      className="mt-7 w-full resize-none rounded-md border border-primary/20 bg-background px-4 py-3 text-lg leading-7 text-primary outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/30"
                      placeholder="Ex.: trabalho, horários, ansiedade, refeições fora de casa..."
                    />
                  </>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <button type="button" onClick={() => setCurrentStep(previous => Math.max(previous - 1, 0))} disabled={currentStep === 0} className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-35">
                  <ArrowLeft className="size-4" aria-hidden="true" /> Voltar
                </button>
                {currentStep === totalSteps - 1 ? (
                  <button type="submit" disabled={!canContinue} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-35">
                    Continuar no WhatsApp <MessageCircle className="size-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button type="button" onClick={next} disabled={!canContinue} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-35">
                    Continuar <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </SpotlightCard>
    </section>
  )
}
