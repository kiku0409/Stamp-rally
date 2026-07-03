import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  retries: 0,
  // WSL2 のファイルシステムが遅く、単一 dev サーバを共有するため直列実行で安定させる
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    locale: 'ja-JP',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    // CIのコールドコンパイル＋ローカルWSLの遅いFSの両方を考慮して長めに
    timeout: 180_000,
  },
});
