import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { LoginPage } from '../../src/pages/auth/loginPage';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup.use({ storageState: { cookies: [], origins: [] } });

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto(`${process.env.site_url!}/wp-admin/`);
  await loginPage.userName.fill(process.env.userName!);
  await loginPage.userPass.fill(process.env.pass!);
  await loginPage.loginBtn.click();
  await page.waitForLoadState('load');
  await page.waitForURL(`${process.env.site_url!}/wp-admin/`);
  await page.context().storageState({ path: './playwright/.auth/user.json' });
});
