import { getAnalytics, getDateRange, parsePeriod, type PeriodKey } from '@/lib/lead-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const periods: { label: string; value: PeriodKey }[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
]

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const params = await searchParams
  const period = parsePeriod(params.range)
  const range = getDateRange(period)
  const periodLabel = periods.find(item => item.value === period)?.label ?? 'Últimos 7 dias'
  const data = await getAnalytics(range)
  const maxDaily = Math.max(...data.daily.map(day => Math.max(day.visitors, day.whatsappClicks)), 1)
  const hasData = data.summary.visitors > 0 || data.summary.pageViews > 0 || data.summary.diagnosticStarted > 0 || data.summary.whatsappClicks > 0

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-primary sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-5 border-b border-primary/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Analytics</p>
            <h1 className="mt-2 font-serif text-5xl leading-none">Analytics</h1>
            <p className="mt-3 max-w-2xl text-sm text-primary/70">Aquisição e conversão da landing page</p>
            <p className="mt-2 text-sm font-medium">{periodLabel} <span className="font-normal text-primary/55">({formatDate(range.start)} a {formatDate(range.end)})</span></p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Período">
            {periods.map(item => (
              <a key={item.value} href={`/admin/analytics?range=${item.value}`} className={`rounded-md border px-3 py-2 text-sm ${period === item.value ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/15 text-primary'}`}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Visitantes" value={data.summary.visitors} />
          <Metric label="Diagnósticos iniciados" value={data.summary.diagnosticStarted} />
          <Metric label="Diagnósticos concluídos" value={data.summary.diagnosticCompleted} />
          <Metric label="Cliques WhatsApp" value={data.summary.whatsappClicks} />
          <Metric label="Page Views" value={data.summary.pageViews} />
          <Metric label="Início / page view" value={formatPercent(data.summary.diagnosticStartRate)} />
          <Metric label="Conclusão / início" value={formatPercent(data.summary.diagnosticCompletionRate)} />
          <Metric label="WhatsApp / conclusão" value={formatPercent(data.summary.whatsappAfterDiagnosticRate)} />
        </section>

        {!hasData && <EmptyState />}

        <section className="mt-10">
          <h2 className="font-serif text-3xl">Evolução</h2>
          <div className="mt-4 overflow-x-auto border-y border-primary/15">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-primary/55"><tr><th className="py-3">Data</th><th>Visitantes</th><th>WhatsApp</th><th className="w-1/3">Volume</th></tr></thead>
              <tbody>
                {data.daily.map(day => <tr key={day.date} className="border-t border-primary/10"><td className="py-3">{formatShortDate(day.date)}</td><td>{day.visitors}</td><td>{day.whatsappClicks}</td><td><Bar value={day.visitors} max={maxDaily} /><Bar value={day.whatsappClicks} max={maxDaily} accent /></td></tr>)}
                {!data.daily.length && <tr><td className="py-5 text-muted-foreground" colSpan={4}>Sem dados no período.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <Table title="Origem do tráfego" rows={data.sources} firstColumn="Origem" emptyText="Nenhuma origem identificada neste período." />
        <Table title="Campanhas" rows={data.campaigns} firstColumn="Campanha" emptyText="Nenhuma campanha identificada neste período." />
        <Table title="Conteúdos" rows={data.contents} firstColumn="Conteúdo" emptyText="Nenhum utm_content identificado neste período." />

        <section className="mt-10">
          <h2 className="font-serif text-3xl">Leitura rápida</h2>
          <div className="mt-4 grid gap-3">
            {data.insights.map(insight => <p key={insight.text} className={`border-l-2 px-4 py-3 text-sm ${insight.warning ? 'border-accent bg-accent/10' : 'border-primary/25 bg-card'}`}>{insight.text}</p>)}
          </div>
        </section>

        <p className="mt-8 text-xs text-primary/50">Dados atualizados ao carregar esta página.</p>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-md border border-primary/15 bg-card p-4"><p className="text-xs uppercase tracking-[0.16em] text-primary/55">{label}</p><p className="mt-3 font-serif text-4xl">{value}</p></div>
}

function Table({ title, rows, firstColumn, emptyText }: { title: string; rows: { label: string; visitors: number; whatsappClicks: number; conversionRate: number }[]; firstColumn: string; emptyText: string }) {
  return (
    <section className="mt-10">
      <h2 className="font-serif text-3xl">{title}</h2>
      <div className="mt-4 overflow-x-auto border-y border-primary/15">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.16em] text-primary/55"><tr><th className="py-3">{firstColumn}</th><th>Visitantes</th><th>Cliques</th><th>Conversão</th></tr></thead>
          <tbody>
            {rows.map(row => <tr key={row.label} className="border-t border-primary/10"><td className="py-3">{row.label}</td><td>{row.visitors}</td><td>{row.whatsappClicks}</td><td>{formatPercent(row.conversionRate)}</td></tr>)}
            {!rows.length && <tr><td className="py-5 text-muted-foreground" colSpan={4}>{emptyText}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Bar({ value, max, accent = false }: { value: number; max: number; accent?: boolean }) {
  return <span className={`mb-1 block h-2 rounded-sm ${accent ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${Math.max((value / max) * 100, value ? 6 : 0)}%` }} />
}

function EmptyState() {
  return (
    <section className="mt-6 border border-primary/15 bg-card p-5">
      <p className="font-medium">Ainda não há dados suficientes neste período.</p>
      <p className="mt-2 text-sm text-primary/65">Abra a landing page por um link com UTM e clique no WhatsApp para validar o tracking.</p>
    </section>
  )
}

function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatShortDate(value: string) {
  const [, month, day] = value.split('-')
  return `${day}/${month}`
}
