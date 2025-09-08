import { test, expect } from '@playwright/test'

test.skip('homepage has correct title', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle(/Optimizely FE PoC/i) // Change to match title from the CMS
})
