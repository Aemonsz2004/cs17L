import { expect, test } from '@playwright/test';
test.describe('RTMS auth and role routing', () => {
    test('admin can log in and is routed to admin dashboard', async ({
        page,
    }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('admin@rtms.test');
        await page.getByLabel('Password').fill('password');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/admin\/dashboard$/);
        await expect(
            page.getByRole('heading', { name: 'Dashboard' }),
        ).toBeVisible();
        await page.goto('/tenant/home');
        await expect(page).toHaveURL(/\/admin\/dashboard$/);
    });
    test('tenant can log in and is routed to tenant home', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('tenant@rtms.test');
        await page.getByLabel('Password').fill('password');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/tenant\/home$/);
        await expect(
            page.getByRole('heading', { name: 'My Unit' }),
        ).toBeVisible();
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL(/\/tenant\/home$/);
    });
    test('invalid credentials stay on login with validation error', async ({
        page,
    }) => {
        await page.goto('/login');
        await page.getByLabel('Email').fill('admin@rtms.test');
        await page.getByLabel('Password').fill('wrong-password');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page).toHaveURL(/\/login$/);
        await expect(
            page.getByText('These credentials do not match our records.'),
        ).toBeVisible();
    });
});
