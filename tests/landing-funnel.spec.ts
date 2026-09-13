import { expect, test } from '@playwright/test'

const baseURL = 'http://localhost:3000'

async function answerDiagnostic(page) {
  await page.getByRole('button', { name: 'Emagrecimento' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Sei o que preciso fazer, mas tenho dificuldade em manter' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('O que mais dificulta sua alimentação hoje?').fill('Minha rotina de trabalho muda muito e acabo comendo fora de horário.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Quero começar nas próximas semanas' }).click()
}

test('desktop: CTA hero passa pelo diagnóstico e preserva origem no WhatsApp', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  const events: unknown[] = []
  await page.route('**/api/lead-events', async route => {
    events.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
  })

  await page.goto(`${baseURL}/?utm_source=instagram&utm_content=story_01`)
  await expect(page.getByRole('heading', { name: 'Uma alimentação que funciona quando a vida acontece.' })).toBeVisible()

  let openedEarly = false
  page.on('popup', () => {
    openedEarly = true
  })
  await page.locator('#inicio').getByRole('button', { name: 'Quero entender meu caso' }).click()
  await expect(page.getByText('1 de 4')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  await expect(page.locator('#pre-consulta')).toBeInViewport()
  await page.waitForTimeout(300)
  expect(openedEarly).toBeFalsy()

  await answerDiagnostic(page)
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByLabel('O que mais dificulta sua alimentação hoje?')).toHaveValue('Minha rotina de trabalho muda muito e acabo comendo fora de horário.')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Quero começar nas próximas semanas' }).click()

  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Continuar no WhatsApp' }).click()
  const popup = await popupPromise
  const url = decodeURIComponent(popup.url()).replaceAll('+', ' ')
  expect(url).toContain('Minha rotina de trabalho muda muito')
  expect(url).toContain('Gostaria de entender qual acompanhamento faria mais sentido')
  expect(events.some(event => event.eventType === 'DIAGNOSTIC_STARTED' && event.content === 'hero_understand_case')).toBeTruthy()
  expect(events.some(event => event.eventType === 'DIAGNOSTIC_COMPLETED' && event.content === 'hero_understand_case')).toBeTruthy()
  expect(events.some(event => event.eventType === 'WHATSAPP_CLICK' && event.content === 'hero_understand_case')).toBeTruthy()
})

test('mobile reduced motion: sticky CTA abre diagnóstico sem overflow horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/lead-events', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
  await page.goto(baseURL)

  await page.locator('button[aria-label="Entender meu caso"]').click()
  await expect(page.getByText('1 de 4')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  expect(overflow).toBeFalsy()
  await expect(page.getByRole('heading', { name: 'A alimentação precisa funcionar aqui.' })).toBeAttached()
  await expect(page.locator('img[alt*="Larissa Vital"]').first()).toBeVisible()
})
