import { expect, test } from '@playwright/test'

import { layoutOf, planDallasToDenver } from './support/app.ts'

test('steps the forecast hour from the timeline', async ({ page }, testInfo) => {
  await planDallasToDenver(page)

  if (layoutOf(testInfo) === 'phone') {
    // Phones start with the forecast chip; it opens the timeline.
    await page.getByRole('button', { name: /^Open forecast timeline/ }).click()
  }
  const slider = page.getByRole('slider', { name: 'Heatmap forecast hour' })
  await expect(slider).toBeVisible()

  const before = Number(await slider.getAttribute('aria-valuenow'))
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', String(Math.min(before + 1, 48)))
  await expect(page.getByText(`+${Math.min(before + 1, 48)}h`).first()).toBeVisible()
})

test('switches theme and opens the risk help', async ({ page, isMobile }) => {
  await page.goto('/')
  const html = page.locator('html')
  const wasDark = ((await html.getAttribute('class')) ?? '').includes('dark')

  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click()
  if (wasDark) await expect(html).not.toHaveClass(/dark/)
  else await expect(html).toHaveClass(/dark/)

  // The handheld header keeps only the trip button, logo and theme toggle.
  if (isMobile) return
  await page.getByRole('button', { name: 'How risk is calculated' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('renders the map without page or map errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  // MapLibre reports a missing worker on the console, not as a page error.
  page.on('console', (message) => {
    if (message.type() === 'error' && /Worker failed to load/i.test(message.text())) {
      errors.push(message.text())
    }
  })
  await planDallasToDenver(page)
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  // The worker is what turns tiles into pixels; it must have loaded.
  await expect
    .poll(() =>
      page.evaluate(() =>
        performance.getEntriesByType('resource').some((e) => /maplibre-gl-worker/.test(e.name)),
      ),
    )
    .toBe(true)
  expect(errors).toEqual([])
})
