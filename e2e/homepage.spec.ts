import { test, expect } from '@playwright/test'

test('root route renders in mock mode (even if 404) and has a reasonable title', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveTitle(/(My Site|Not Found)/i)
})
