'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Check, Menu, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AnimatedContent } from '@/components/ui/animated-content'
import { DriftWall, type DriftWallItem } from '@/components/ui/drift-wall'
import { SplitText } from '@/components/ui/split-text'
import { PreConsultation } from '@/components/sections/pre-consultation'
import {
  authorityPortraitImage,
  clinicalPortraitImage,
  consultationPortraitImage,
  editorialPortraitImage,
  foodImage,
  instagramUrl,
  portraitImage,
  profileImage,
  siteConfig,
} from '@/lib/site-config'

const Label = ({ children, light = false }: { children: string; light?: boolean }) => (
  <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.22em] ${light ? 'text-secondary' : 'text-accent'}`}>{children}</span>
)

const focusDiagnostic = (content: string) => () => window.dispatchEvent(new CustomEvent('preconsultation-start', { detail: { content } }))

const cycle = ['Você começa bem', 'A rotina muda', 'O planejamento deixa de funcionar', 'Tudo parece voltar ao começo']
const beyond = [
  ['01', 'Rotina', 'Uma estratégia precisa sobreviver aos dias que não saem como planejado.'],
  ['02', 'Ambiente', 'Trabalho, família e vida social também participam das escolhas.'],
  ['03', 'Expectativa', 'Buscar perfeição transforma pequenos desvios em sensação de fracasso.'],
  ['04', 'Estratégia', 'Orientação só gera valor quando consegue ser executada.'],
] as const
const fitItems = [
  'sabe o que precisa mudar, mas encontra dificuldade em manter;',
  'já tentou dietas que funcionaram apenas por um período;',
  'tem uma rotina que dificulta seguir regras rígidas;',
  'procura emagrecer ou melhorar a alimentação com orientação individualizada.',
] as const
const faqs = [
  ['Preciso seguir uma dieta muito restritiva?', 'Não é esse o ponto de partida. A conversa começa entendendo objetivo, rotina, preferências e dificuldades para pensar em uma estratégia que faça sentido para você.'],
  ['E se minha rotina mudar muito durante a semana?', 'Isso importa. Horários, trabalho, família, finais de semana e imprevistos entram na avaliação para que a orientação não dependa de uma semana perfeita.'],
  ['O acompanhamento é individualizado?', 'Sim. As decisões são construídas a partir do seu contexto, não de uma lista pronta de regras.'],
  ['Já tentei outras dietas. Ainda faz sentido?', 'Faz sentido quando a conversa investiga por que aquilo não se sustentou antes de propor outro caminho.'],
  ['Preciso saber exatamente qual acompanhamento escolher?', 'Não. O primeiro contato serve justamente para entender seu momento e ver qual formato faz sentido.'],
  ['Como funciona para começar?', 'Você responde algumas perguntas rápidas e continua pelo WhatsApp com mais contexto para a Larissa entender seu caso.'],
] as const
const lifeItems: DriftWallItem[] = [
  { src: consultationPortraitImage, alt: 'Larissa Vital em retrato profissional com jaleco', label: 'Autoridade' },
  { src: profileImage, alt: 'Larissa Vital em ambiente de atendimento nutricional', label: 'Atendimento' },
  { src: portraitImage, alt: 'Larissa Vital segurando uma fatia de kiwi', label: 'Nutrição' },
  { src: foodImage, alt: 'Ingredientes coloridos organizados sobre uma mesa', label: 'Ingredientes' },
  { src: clinicalPortraitImage, alt: 'Larissa Vital segurando adipômetro em retrato profissional', label: 'Avaliação' },
  { label: 'Rotina', alt: 'Bloco textual sobre rotina', tone: 'bg-secondary/80' },
  { label: 'Fins de semana', alt: 'Bloco textual sobre fins de semana', tone: 'bg-card' },
  { label: 'Vida real', alt: 'Bloco textual sobre vida real', tone: 'bg-background' },
  { label: 'Trabalho', alt: 'Bloco textual sobre trabalho', tone: 'bg-secondary/70' },
  { label: 'Horários', alt: 'Bloco textual sobre horários', tone: 'bg-card' },
  { label: 'Mercado', alt: 'Bloco textual sobre mercado', tone: 'bg-background' },
  { label: 'Constância', alt: 'Bloco textual sobre constância', tone: 'bg-secondary/75' },
]

function CtaButton({ children, content, variant = 'primary' }: { children: string; content: string; variant?: 'primary' | 'accent' }) {
  return (
    <button type="button" onClick={focusDiagnostic(content)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${variant === 'accent' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/92'}`}>
      {children} <ArrowDown className="size-4" aria-hidden="true" />
    </button>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-primary/8 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
        <a href="#inicio" className="grid leading-none text-primary sm:grid-cols-[auto_auto] sm:items-end sm:gap-3">
          <span className="font-serif text-2xl">Larissa Vital</span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-accent sm:mt-0">Nutricionista</span>
        </a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegação principal">
          {siteConfig.nav.map(item => <a key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{item.label}</a>)}
        </nav>
        <button type="button" onClick={focusDiagnostic('nav_understand_case')} className="group hidden items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/92 md:flex">Quero entender meu caso <ArrowDown className="size-4" aria-hidden="true" /></button>
        <button className="rounded-md p-2 text-primary md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
      {open ? (
        <nav className="flex flex-col gap-5 border-t border-primary/10 bg-background px-6 py-5 md:hidden" aria-label="Menu móvel">
          {siteConfig.nav.map(item => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="text-sm text-primary">{item.label}</a>)}
          <button type="button" onClick={focusDiagnostic('mobile_nav_understand_case')} className="rounded-md bg-primary px-5 py-3 text-center text-sm text-primary-foreground">Quero entender meu caso</button>
        </nav>
      ) : null}
    </header>
  )
}

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-background pt-24 sm:pt-28">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[58%] bg-[linear-gradient(135deg,color-mix(in_oklch,var(--secondary)_38%,transparent),transparent_55%)]" />
      <div className="mx-auto grid max-w-[1480px] gap-10 px-5 pb-14 sm:px-8 lg:grid-cols-12 lg:items-center lg:px-10 lg:pb-20">
        <div className="relative z-10 lg:col-span-7 xl:col-span-6">
          <Label>LARISSA VITAL · NUTRICIONISTA</Label>
          <SplitText tag="h1" text="Uma alimentação que funciona quando a vida acontece." splitType="words" delay={60} duration={0.75} ease="power3.out" className="mt-6 max-w-[11ch] font-serif text-[clamp(3rem,15vw,5rem)] leading-[0.92] text-primary sm:max-w-[12ch] sm:text-[clamp(4.6rem,10vw,6.7rem)] lg:text-[clamp(4.9rem,6.2vw,7rem)]" />
          <div className="mt-7 max-w-2xl border-l border-accent/70 pl-5 sm:mt-9">
            <p className="text-lg leading-8 text-primary sm:text-xl">Você já pode saber muito sobre o que deveria comer.</p>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">O desafio começa quando essa orientação precisa coexistir com trabalho, compromissos, finais de semana e imprevistos.</p>
            <p className="mt-4 font-serif text-2xl leading-tight text-primary">É nesse ponto que o acompanhamento começa.</p>
          </div>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <CtaButton content="hero_understand_case">Quero entender meu caso</CtaButton>
            <a href="#sobre" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline decoration-accent decoration-2 underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Conhecer a Larissa <ArrowDown className="size-4" aria-hidden="true" /></a>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/58">Emagrecimento · Reeducação alimentar · Atendimento individualizado</p>
        </div>
        <figure className="relative -mx-5 aspect-[4/5] overflow-hidden bg-secondary sm:mx-0 sm:aspect-[0.92] lg:col-span-5 lg:aspect-[0.76] xl:col-span-6 xl:ml-10">
          <Image src={editorialPortraitImage} alt="Nutricionista Larissa Vital em retrato editorial" fill priority sizes="(max-width: 1024px) 100vw, 46vw" quality={86} className="object-cover object-[center_15%]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_45%),linear-gradient(0deg,color-mix(in_oklch,var(--primary)_30%,transparent),transparent_38%)]" />
          <figcaption className="absolute bottom-5 left-5 max-w-[15rem] border-l border-secondary/80 bg-background/88 px-4 py-3 text-sm leading-5 text-primary backdrop-blur">Nutrição para decisões possíveis fora da consulta.</figcaption>
        </figure>
      </div>
    </section>
  )
}

export function RecognitionSection() {
  return (
    <section id="para-voce" className="bg-card px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1200px]">
        <Label>UM CICLO COMUM</Label>
        <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <h2 className="max-w-xl font-serif text-4xl leading-tight text-primary sm:text-6xl">Saber o que fazer nem sempre significa conseguir manter.</h2>
          <div>
            <div className="grid gap-0 border-y border-primary/15">
              {cycle.map((item, index) => (
                <AnimatedContent key={item} delay={index * 0.04} distance={24} className="grid grid-cols-[2.5rem_1fr] items-center border-b border-primary/12 py-4 last:border-b-0">
                  <span className="text-2xl text-accent" aria-hidden="true">{index ? '↓' : ''}</span>
                  <p className="font-serif text-2xl text-primary sm:text-3xl">{item}</p>
                </AnimatedContent>
              ))}
            </div>
            <div className="mt-9 max-w-2xl">
              <p className="font-serif text-3xl leading-tight text-primary sm:text-4xl">Quando isso acontece repetidamente, insistir na mesma estratégia não resolve o problema.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LarissaAuthority() {
  return (
    <section id="sobre" className="overflow-hidden bg-[linear-gradient(135deg,var(--background),color-mix(in_oklch,var(--secondary)_42%,var(--background)))] px-5 py-18 sm:px-8 lg:px-10 lg:py-28">
      <AnimatedContent className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-12 lg:items-center">
        <div className="relative lg:col-span-5">
          <div className="absolute -left-5 top-10 hidden h-44 w-28 border-l border-t border-accent/45 lg:block" aria-hidden="true" />
          <div aria-hidden="true" className="absolute -bottom-7 -right-6 hidden h-44 w-44 bg-accent/12 lg:block" />
          <figure className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary shadow-[0_24px_80px_color-mix(in_oklch,var(--primary)_13%,transparent)]">
            <Image src={authorityPortraitImage} alt="Larissa Vital em retrato profissional com jaleco" fill loading="lazy" sizes="(max-width: 1024px) 92vw, 36vw" quality={85} className="object-cover object-[center_16%]" />
          </figure>
          <p className="absolute -bottom-6 right-4 max-w-[13rem] bg-primary px-5 py-4 font-serif text-2xl leading-tight text-secondary shadow-xl">Nutrição para a vida real.</p>
        </div>
        <div className="lg:col-span-7 lg:pl-10">
          <Label>QUEM VAI TE ACOMPANHAR</Label>
          <h2 className="mt-5 font-serif text-5xl leading-tight text-primary sm:text-7xl">Oi, sou a Larissa.</h2>
          <div className="mt-8 grid gap-5 text-lg leading-8 text-muted-foreground">
            <p>Nutricionista com atuação em emagrecimento e reeducação alimentar.</p>
            <p>O atendimento considera mais do que o prato.</p>
            <p>Rotina, horários, preferências, histórico de tentativas e dificuldades práticas definem o que pode funcionar.</p>
            <p className="font-serif text-2xl leading-tight text-primary sm:text-3xl">Existe uma diferença entre saber o que fazer e conseguir sustentar esse comportamento.</p>
            <p><strong className="font-semibold text-primary">Essa diferença precisa ser compreendida antes da estratégia alimentar.</strong></p>
            <p>Uma orientação só faz sentido quando consegue existir fora do consultório.</p>
          </div>
          <div className="mt-8 border-t border-primary/16 pt-6">
            <p className="font-serif text-3xl text-primary">Larissa Vital</p>
            <p className="mt-1 text-sm uppercase tracking-[0.16em] text-muted-foreground">Nutricionista · Emagrecimento e Reeducação Alimentar</p>
            <div className="mt-5"><CtaButton content="authority_understand_case">Quero conversar sobre meu objetivo</CtaButton></div>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline decoration-accent decoration-2 underline-offset-8" aria-label="Abrir Instagram da Larissa Vital em uma nova aba">{siteConfig.instagram} <ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </div>
        </div>
      </AnimatedContent>
    </section>
  )
}

export function BeyondThePlate() {
  return (
    <section className="overflow-hidden bg-secondary px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
        <figure className="relative hidden aspect-[3/4] overflow-hidden rounded-lg bg-primary/10 lg:block">
          <Image src={foodImage} alt="Ingredientes variados usados como referência visual de alimentação" fill loading="lazy" sizes="30vw" quality={78} className="object-cover object-center" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--secondary)_18%,transparent),color-mix(in_oklch,var(--primary)_50%,transparent))]" />
        </figure>
        <div>
          <div className="max-w-3xl">
            <Label>ALÉM DO PRATO</Label>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-primary sm:text-6xl">Nem sempre o maior problema está no prato.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Alimentação envolve contexto, ambiente e expectativa. Esses fatores mudam o que é possível sustentar.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {beyond.map(([number, title, text], index) => (
              <AnimatedContent key={title} delay={index * 0.04} className="border-t border-primary/25 bg-background/45 p-6 backdrop-blur">
                <span className="font-mono text-xs text-accent">{number}</span>
                <h3 className="mt-8 font-serif text-3xl text-primary">{title}</h3>
                <p className="mt-4 text-base leading-7 text-muted-foreground">{text}</p>
              </AnimatedContent>
            ))}
          </div>
          <p className="mt-12 max-w-3xl border-l-2 border-accent pl-5 font-serif text-3xl leading-tight text-primary sm:text-4xl">Pessoas com o mesmo objetivo podem precisar de caminhos completamente diferentes.</p>
        </div>
      </div>
    </section>
  )
}

export function LifeWall() {
  return (
    <section className="overflow-hidden bg-primary px-5 py-18 text-primary-foreground sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        <div>
          <Label light>VIDA REAL</Label>
          <h2 className="mt-5 font-serif text-5xl leading-tight text-secondary sm:text-7xl">A alimentação precisa funcionar aqui.</h2>
          <p className="mt-7 max-w-md text-lg leading-8 text-primary-foreground/76">Trabalho, horários que mudam, refeições fora de casa, finais de semana e imprevistos fazem parte da estratégia.</p>
        </div>
        <DriftWall items={lifeItems} speed={4.5} tilt={5} turn={-4} depth={32} dim={0.92} fade={0.78} radius={12} overlayColor="color-mix(in oklch, var(--primary) 16%, transparent)" className="-mx-5 sm:mx-0" />
      </div>
    </section>
  )
}

export function FitSection() {
  return (
    <section className="bg-card px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Label>PARA QUEM FAZ SENTIDO</Label>
          <h2 className="mt-5 font-serif text-4xl leading-tight text-primary sm:text-6xl">Esse acompanhamento faz sentido para quem...</h2>
        </div>
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fitItems.map(item => (
              <div key={item} className="flex gap-3 border-t border-primary/15 pt-4">
                <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                <p className="text-base leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 max-w-xl">
            <p className="font-serif text-3xl leading-tight text-primary">Não é preciso chegar com tudo organizado.</p>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">É justamente o contexto atual que orienta a conversa inicial.</p>
            <div className="mt-7"><CtaButton content="fit_understand_case">Quero entender meu caso</CtaButton></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FAQ() {
  return (
    <section id="duvidas" className="bg-secondary px-5 py-18 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <Label>DÚVIDAS FREQUENTES</Label>
          <h2 className="mt-5 font-serif text-4xl leading-tight text-primary sm:text-5xl">Perguntas importantes antes de conversar</h2>
          <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">Algumas dúvidas comuns antes de iniciar uma conversa.</p>
        </div>
        <Accordion className="w-full">
          {faqs.map(([question, answer], index) => (
            <AccordionItem value={`item-${index}`} key={question}>
              <AccordionTrigger className="py-5 text-left font-serif text-xl text-primary hover:no-underline">{question}</AccordionTrigger>
              <AccordionContent className="max-w-xl text-base leading-7 text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export function Footer() {
  const [hideFloatingCta, setHideFloatingCta] = useState(false)

  useEffect(() => {
    const update = (event: Event) => setHideFloatingCta(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open))
    window.addEventListener('preconsultation-visibility', update)
    return () => window.removeEventListener('preconsultation-visibility', update)
  }, [])

  return (
    <>
      <section className="relative overflow-hidden bg-primary px-5 py-20 text-primary-foreground sm:px-8 lg:px-10 lg:py-28">
        <Image src={consultationPortraitImage} alt="" fill loading="lazy" sizes="100vw" quality={76} className="object-cover object-[center_18%] opacity-22" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,var(--primary)_0%,color-mix(in_oklch,var(--primary)_92%,transparent)_46%,color-mix(in_oklch,var(--primary)_55%,transparent)_100%)]" />
        <AnimatedContent className="relative mx-auto max-w-[1200px]">
          <Label light>PRÓXIMO PASSO</Label>
          <h2 className="mt-6 max-w-4xl font-serif text-5xl leading-tight text-secondary sm:text-7xl">O próximo passo não precisa ser outra dieta.</h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-primary-foreground/75">Comece entendendo sua rotina, suas dificuldades e o que precisa mudar para uma estratégia funcionar.</p>
          <div className="mt-9"><CtaButton content="final_understand_case" variant="accent">Quero entender meu caso</CtaButton></div>
        </AnimatedContent>
      </section>
      <footer className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 text-sm text-background/65 sm:grid-cols-[1.1fr_.9fr_.9fr] sm:px-8 lg:px-10">
          <div>
            <p className="font-serif text-xl text-background">Larissa Vital</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em]">Nutricionista</p>
            <p className="mt-6 text-xs">© {new Date().getFullYear()} Larissa Vital</p>
          </div>
          <nav className="grid content-start gap-3" aria-label="Navegação do rodapé">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-background/45">Navegação</p>
            {siteConfig.nav.map(item => <a key={item.href} href={item.href} className="transition-colors hover:text-background">{item.label}</a>)}
          </nav>
          <div className="grid content-start gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-background/45">Contato</p>
            <button type="button" onClick={focusDiagnostic('footer_understand_case')} className="inline-flex items-center gap-2 text-left transition-colors hover:text-background">Entender meu caso <ArrowDown className="size-4" aria-hidden="true" /></button>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram da Larissa Vital em uma nova aba" className="inline-flex items-center gap-2 transition-colors hover:text-background">{siteConfig.instagram}<ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </div>
        </div>
      </footer>
      {!hideFloatingCta ? (
        <button type="button" onClick={focusDiagnostic('sticky_cta')} aria-label="Entender meu caso" className="fixed bottom-5 right-5 z-30 flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <ArrowDown aria-hidden="true" /><span className="hidden sm:inline">Entender meu caso</span>
        </button>
      ) : null}
    </>
  )
}

export { PreConsultation }
