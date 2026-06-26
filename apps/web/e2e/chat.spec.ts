import { expect, test } from '@playwright/test';

test('loads the chat shell with starter suggestions', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /how can i help/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /what projects are in this portfolio/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: /message the assistant/i }),
  ).toBeVisible();
});

test('serves the health endpoint', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: 'ok' });
});
