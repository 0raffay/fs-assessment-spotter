import { expect, type Page, type TestInfo } from '@playwright/test'

export type Layout = 'desktop' | 'phone'

export function layoutOf(testInfo: TestInfo): Layout {
  return testInfo.project.name === 'phone' ? 'phone' : 'desktop'
}

/**
 * Picks a place from the From/To combobox: types the query, chooses the option whose name matches
 * `option` (options read "Dallas TX"), and checks the input then shows `value` ("Dallas, TX").
 */
export async function choosePlace(
  page: Page,
  label: 'From' | 'To',
  query: string,
  option: RegExp,
  value: RegExp,
) {
  const input = page.getByRole('combobox', { name: label })
  await input.fill(query)
  await page
    .getByRole('listbox', { name: `${label} suggestions` })
    .getByRole('option', { name: option })
    .first()
    .click()
  await expect(input).toHaveValue(value)
}

/** Fills the form (Dallas → Denver) and submits it; resolves once route cards are on screen. */
export async function planDallasToDenver(page: Page) {
  await page.goto('/')
  await choosePlace(page, 'From', 'Dallas', /^Dallas TX/, /Dallas, TX/)
  await choosePlace(page, 'To', 'Denver', /^Denver CO/, /Denver, CO/)
  await page.getByPlaceholder('42,000').fill('42000')
  await page.getByRole('button', { name: 'Plan routes' }).click()
  await expect(routeCards(page).first()).toBeVisible()
}

/** The route option buttons (each card is a toggle). */
export function routeCards(page: Page) {
  return page.getByRole('region', { name: 'Route options' }).locator('button[aria-pressed]')
}

/** Opens a tool from the map rail. */
export async function openTool(page: Page, name: string) {
  const button = page.getByRole('toolbar', { name: 'Map tools' }).getByRole('button', { name })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}
