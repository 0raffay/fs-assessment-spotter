import { expect, test } from '@playwright/test'

import { choosePlace, planDallasToDenver, routeCards } from './support/app.ts'

test.describe('planning a trip', () => {
  test('shows validation errors before anything is requested', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Plan routes' }).click()
    // The route group shows its first message; both fields are marked invalid.
    await expect(page.getByText('Choose where the trip starts')).toBeVisible()
    await expect(page.getByText('Enter the load weight')).toBeVisible()
    for (const name of ['From', 'To']) {
      await expect(page.getByRole('combobox', { name })).toHaveAttribute('aria-invalid', 'true')
    }
    await expect(page.getByRole('region', { name: 'Route options' })).toBeHidden()
  })

  test('rejects the same origin and destination', async ({ page }) => {
    await page.goto('/')
    await choosePlace(page, 'From', 'Dallas', /^Dallas TX/, /Dallas, TX/)
    await choosePlace(page, 'To', 'Dallas', /^Dallas TX/, /Dallas, TX/)
    await page.getByPlaceholder('42,000').fill('42000')
    await page.getByRole('button', { name: 'Plan routes' }).click()
    await expect(page.getByText('Destination must differ from the origin')).toBeVisible()
  })

  test('plans three ranked routes and recommends the first', async ({ page, isMobile }) => {
    await planDallasToDenver(page)

    await expect(page).toHaveURL(/[?&]trip=/)
    // The handheld header has no room for the status line.
    if (!isMobile) await expect(page.getByText(/Forecast updated/)).toBeVisible()
    await expect(routeCards(page)).toHaveCount(3)

    const recommended = routeCards(page).first()
    await expect(recommended).toHaveAttribute('aria-pressed', 'true')
    await expect(recommended).toContainText('Recommended')
    await expect(page.getByLabel('Why this route')).toBeVisible()
  })

  test('selects another route', async ({ page }) => {
    await planDallasToDenver(page)
    const second = routeCards(page).nth(1)
    await second.click()
    await expect(second).toHaveAttribute('aria-pressed', 'true')
    await expect(routeCards(page).first()).toHaveAttribute('aria-pressed', 'false')
  })

  test('restores the trip from a shared link', async ({ page }) => {
    await planDallasToDenver(page)
    const url = page.url()

    await page.goto('about:blank')
    await page.goto(url)
    await expect(routeCards(page)).toHaveCount(3)
    await expect(routeCards(page).first()).toContainText('Recommended')
  })
})
