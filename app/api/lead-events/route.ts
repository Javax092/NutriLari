import { createLeadEvent, parseLeadEventPayload } from '@/lib/lead-events'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = parseLeadEventPayload(payload)
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 })

  try {
    await createLeadEvent(parsed.data)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Lead event not registered.', error)
    return Response.json({ ok: false, error: 'Evento não registrado.' }, { status: 503 })
  }
}
