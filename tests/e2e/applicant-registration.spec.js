import { expect, test } from '@playwright/test';

test.describe('Applicant registration', () => {
    test('guest can register and gets routed to applicant dashboard', async ({ page }) => {
        const stamp = Date.now();
        const email = `applicant_${stamp}@rtms.test`;
        const password = 'Password123!';

        await page.goto('/apply/register');

        await expect(
            page.getByRole('heading', { name: 'Create Applicant Account' }),
        ).toBeVisible();

        await page.getByLabel('Email', { exact: true }).fill(email);
        await page.getByLabel('Password', { exact: true }).fill(password);
        await page.getByLabel('Confirm Password', { exact: true }).fill(password);

        await page.getByRole('button', { name: 'Create account' }).click();

        await expect(page).toHaveURL(/\/apply\/dashboard$/);
        await expect(
            page.getByRole('heading', { name: 'Applicant Dashboard' }),
        ).toBeVisible();
    });

    test('register page has a link back to front page', async ({ page }) => {
        await page.goto('/apply/register');

        const backLink = page.getByRole('link', { name: 'Back to Front Page' });
        await expect(backLink).toBeVisible();
        await backLink.click();

        await expect(page).toHaveURL('/');
    });
});
