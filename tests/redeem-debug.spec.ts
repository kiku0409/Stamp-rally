import { test, expect } from '@playwright/test';

const SCRATCHPAD = '/tmp/claude-0/-home-user-Stamp-rally/d3fd3329-354c-57c3-b5fa-64930b5d46f6/scratchpad';

const fakeUser = {
  id: 'fake-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
};
const fakeSession = {
  access_token: 'fake-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'fake-refresh',
  user: fakeUser,
};

test('debug: what is on /admin/redeem after auth mock', async ({ page }) => {
  // Intercept Supabase auth
  await page.route('**supabase**', async (route) => {
    const url = route.request().url();
    console.log('SUPABASE REQUEST:', url);
    if (url.includes('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeUser) });
    } else if (url.includes('/auth/v1/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeSession) });
    } else {
      await route.continue();
    }
  });

  await page.addInitScript((session) => {
    const orig = Object.getOwnPropertyDescriptor(Storage.prototype, 'getItem')!;
    Object.defineProperty(Storage.prototype, 'getItem', {
      value: function (key: string) {
        const result = orig.value!.call(this, key);
        if (typeof key === 'string' && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          console.log('getItem called for', key, '→ returning fake session');
          return JSON.stringify(session);
        }
        return result;
      },
      writable: true,
      configurable: true,
    });
  }, fakeSession);

  await page.goto('http://localhost:3000/admin/redeem');
  await page.waitForTimeout(5000);

  const url = page.url();
  const title = await page.title();
  const bodyText = await page.locator('body').innerText().catch(() => 'ERROR');

  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Body (first 500 chars):', bodyText.substring(0, 500));

  await page.screenshot({ path: `${SCRATCHPAD}/redeem-debug.png`, fullPage: true });
});
