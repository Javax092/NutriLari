export const siteConfig = {
  name: 'Larissa Vital',
  profession: 'Nutricionista',
  positioning: 'Emagrecimento e reeducação alimentar',
  instagram: '@nutri.larivital',
  whatsapp: '5592994615755',
  whatsappDisplay: '(92) 99461-5755',
  featureFlags: { testimonials: false, transformationProgram: false, analytics: true },
  nav: [
    { label: 'Início', href: '#inicio' },
    { label: 'Para você', href: '#para-voce' },
    { label: 'Diagnóstico', href: '#pre-consulta' },
    { label: 'Larissa', href: '#sobre' },
    { label: 'Dúvidas', href: '#duvidas' },
  ],
} as const

export type PreConsultationAnswers = {
  goal: string
  situation: string
  obstacle: string
  startTiming: string
}

export const processSteps = [
  { number: '01', title: 'ENTENDER', description: 'Conversamos sobre rotina, alimentação, objetivos, preferências e os pontos que mais dificultam seu progresso.' },
  { number: '02', title: 'PLANEJAR', description: 'A partir disso, construímos uma estratégia alimentar individualizada e compatível com a sua realidade.' },
  { number: '03', title: 'ACOMPANHAR', description: 'Nas próximas etapas, avaliamos o que está funcionando e ajustamos o que for necessário.' },
]
export const realLifeMoments = [['Rotina corrida', 'Você sente dificuldade em organizar refeições quando o dia muda muito.'], ['Dietas que não duram', 'Você começa bem, mas abandona porque o plano não conversa com a sua vida.'], ['Escolhas com culpa', 'Você quer comer melhor sem transformar cada refeição em cobrança.'], ['Orientação profissional', 'Você procura um caminho possível para construir hábitos com mais constância.']] as const
export const thinkingShifts = [['Estratégia individualizada', 'As orientações partem da sua rotina, preferências e objetivo — não de um modelo pronto.'], ['Ajustes ao longo do caminho', 'O acompanhamento permite entender o que funcionou na prática e adaptar quando necessário.'], ['Mais autonomia', 'A ideia é que você entenda melhor suas escolhas, sem depender de regras rígidas para sempre.'], ['Uma rotina possível', 'A alimentação precisa coexistir com trabalho, família, fins de semana e imprevistos.']] as const
export const buildWhatsAppMessage = () => 'Olá, Larissa! Conheci seu trabalho pelo site e gostaria de entender melhor como funciona o acompanhamento nutricional.'
export const trackEvent = (event: string, payload: Record<string, unknown> = {}) => { if (siteConfig.featureFlags.analytics && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('site-event', { detail: { event, ...payload } })) }
export const instagramUrl = 'https://www.instagram.com/nutri.larivital/'
export const foodImage = '/nutri.webp'
export const portraitImage = '/larinutri.jpeg'
export const profileImage = '/ja.webp'
export const editorialPortraitImage = '/larimini.jpeg'
export const authorityPortraitImage = '/WhatsApp Image 2026-09-13 at 15.28.54 (4).jpeg'
export const consultationPortraitImage = '/WhatsApp Image 2026-09-13 at 15.28.54 (1).jpeg'
export const clinicalPortraitImage = '/WhatsApp Image 2026-09-13 at 15.28.54 (2).jpeg'
