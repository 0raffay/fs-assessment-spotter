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
