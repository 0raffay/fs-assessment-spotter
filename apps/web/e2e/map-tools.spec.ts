import { expect, test } from '@playwright/test'

import { layoutOf, openTool, planDallasToDenver } from './support/app.ts'

test.describe('map tools', () => {
  test.beforeEach(async ({ page }) => {
    await planDallasToDenver(page)
  })

  test('changes the heatmap measure, a layer and the basemap', async ({ page }) => {
    await openTool(page, 'Map layers')
    const panel = page.getByRole('region', { name: 'Map layers' })

    await panel.getByRole('radio', { name: 'Wind' }).click()
    await expect(panel.getByRole('radio', { name: 'Wind' })).toHaveAttribute('aria-checked', 'true')

    const alternates = panel.getByRole('switch', { name: 'Alternate routes' })
    await alternates.click()
    await expect(alternates).toHaveAttribute('aria-checked', 'false')

    await panel.getByRole('radio', { name: 'Terrain' }).click()
    await expect(panel.getByRole('radio', { name: 'Terrain' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  })

  test('switches to the satellite view', async ({ page }) => {
    await openTool(page, 'Map layers')
    const panel = page.getByRole('region', { name: 'Map layers' })
    const imagery = page.waitForRequest(/basemap\.nationalmap\.gov\/.+\/tile\//)
    await panel.getByRole('radio', { name: 'Satellite' }).click()
    await expect(panel.getByRole('radio', { name: 'Satellite' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    // The map asks USGS for imagery tiles (we check the request, not the CDN's answer).
    await imagery
    await expect(page.getByText(/USGS The National Map/)).toBeAttached()
  })

  test('shows the legend', async ({ page }) => {
    await openTool(page, 'Legend')
    const legend = page.getByRole('region', { name: 'Legend' })
    for (const level of ['Low', 'Moderate', 'High', 'Severe', 'No Travel']) {
      await expect(legend.getByText(level, { exact: true })).toBeVisible()
    }
  })

  test('picks a checkpoint from the list and shows its details', async ({ page }, testInfo) => {
    await openTool(page, 'Checkpoint list')
    const list = page.getByRole('list', { name: /Checkpoints on route/ })
    await list.getByRole('button').nth(2).click()

    const card = page.getByRole('article', { name: 'Checkpoint 3 details' })
    await expect(card).toBeVisible()
    await expect(card).toContainText(/Mile 50/)

    if (layoutOf(testInfo) === 'phone') {
      // Handheld layouts close the list so the docked card is visible.
      await expect(list).toBeHidden()
    } else {
      await expect(list.getByRole('button').nth(2)).toHaveAttribute('aria-current', 'true')
    }

    await card.getByRole('button', { name: 'Next checkpoint' }).click()
    await expect(page.getByRole('article', { name: 'Checkpoint 4 details' })).toBeVisible()
  })

  test('filters checkpoints by risk', async ({ page }) => {
    await openTool(page, 'Checkpoint list')
    const panel = page.getByRole('region', { name: 'Checkpoints' })
    const all = await panel.getByRole('list').getByRole('button').count()

    await panel.getByRole('radio', { name: /High\+/ }).click()
    const high = panel.getByRole('list').getByRole('button')
    const empty = panel.getByText(/No checkpoints at High or above/)
    await expect(high.first().or(empty)).toBeVisible()
    expect(await high.count()).toBeLessThan(all)
  })
})

test.describe('risk profile (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, 'The risk profile is desktop only')

  test('takes the bottom dock from the forecast and selects across routes', async ({ page }) => {
    await planDallasToDenver(page)
    await expect(page.getByRole('region', { name: 'Forecast timeline' })).toBeVisible()

    await openTool(page, 'Risk profile')
    const profile = page.getByRole('region', { name: 'Risk profile' })
    await expect(profile).toBeVisible()
    await expect(page.getByRole('region', { name: 'Forecast timeline' })).toBeHidden()

    await profile.getByRole('button', { name: /^Route 2, mile 100:/ }).click()
    await expect(profile.getByText('mi 100')).toBeVisible()
    await expect(profile.getByRole('button', { name: 'Route 2', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('article', { name: /details$/ })).toContainText(/Mile 100/)

    await openTool(page, 'Forecast timeline')
    await expect(profile).toBeHidden()
  })
})

test('fit all routes frames the trip the same after a checkpoint pan', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The zoom buttons are desktop only')
  await planDallasToDenver(page)
  const tools = page.getByRole('toolbar', { name: 'Map tools' })
  const fit = tools.getByRole('button', { name: 'Fit all routes' })
  const pins = async () => {
    await page.waitForTimeout(1200)
    const start = await page.locator('[data-endpoint="start"]').boundingBox()
    const arrive = await page.locator('[data-endpoint="arrive"]').boundingBox()
    return { start: start!, arrive: arrive! }
  }

  await openTool(page, 'Checkpoint list')
  await fit.click()
  const clean = await pins()

  // Zoom in so the last checkpoint is off-screen; selecting it pans the map. The pan used to leave
  // padding on the map, which every later fit added to its own, zooming out (to the whole world on
  // large layouts).
  for (let i = 0; i < 3; i++) await tools.getByRole('button', { name: 'Zoom in' }).click()
  await page
    .getByRole('list', { name: /Checkpoints on route/ })
    .getByRole('button')
    .last()
    .click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Close checkpoint', exact: true }).click()
  await fit.click()
  const after = await pins()

  for (const end of ['start', 'arrive'] as const) {
    expect(Math.abs(after[end].x - clean[end].x)).toBeLessThan(3)
    expect(Math.abs(after[end].y - clean[end].y)).toBeLessThan(3)
  }
})
