import { test, expect } from '@playwright/test';

test.describe('Home component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays app title and subtitle', async ({ page }) => {
    await expect(page.getByText('spotifystats.app')).toBeVisible();
    await expect(page.getByText('Enhanced statistics for spotify')).toBeVisible();
  });

  test('displays username input', async ({ page }) => {
    const input = page.locator('input[matinput]');
    await expect(input).toBeVisible();
  });

  test('displays dropzone for file upload', async ({ page }) => {
    await expect(page.locator('.custom-dropzone')).toBeVisible();
  });

  test('shows invalid state when submitting empty username', async ({ page }) => {
    await page.getByRole('button', { name: /Let's go/ }).click();
    // Dropzone should show invalid state when no files are added
    await expect(page.locator('.custom-dropzone.invalid')).toBeVisible();
  });
});

test.describe('Navigation to main application', () => {
  test('navigates directly to stats and loads general tab by default', async ({ page }) => {
    await page.goto('/user/testuser');

    // Should redirect to general tab
    await expect(page).toHaveURL(/\/user\/testuser\/general/);
    // Stats header should show username
    await expect(page.getByText('Statistics for testuser')).toBeVisible();
  });

  test('displays all navigation tabs', async ({ page }) => {
    await page.goto('/user/testuser/general');
    await expect(page.getByText('Statistics for testuser')).toBeVisible();

    const tabs = ['General', 'Artists', 'Albums', 'Tracks', 'Plays', 'Charts', 'Dataset'];
    for (const tab of tabs) {
      await expect(page.locator('a[mat-tab-link]', { hasText: tab })).toBeVisible();
    }
  });

  test('general tab is active by default', async ({ page }) => {
    await page.goto('/user/testuser/general');
    await expect(page.getByText('Statistics for testuser')).toBeVisible();

    const generalTab = page.locator('a[mat-tab-link]', { hasText: 'General' });
    await expect(generalTab).toHaveClass(/mdc-tab--active/);
  });

  test('can switch between tabs', async ({ page }) => {
    await page.goto('/user/testuser/general');
    await expect(page.getByText('Statistics for testuser')).toBeVisible();

    // Click Artists tab
    await page.locator('a[mat-tab-link]', { hasText: 'Artists' }).click();
    await expect(page).toHaveURL(/\/user\/testuser\/artists/);

    // Click Albums tab
    await page.locator('a[mat-tab-link]', { hasText: 'Albums' }).click();
    await expect(page).toHaveURL(/\/user\/testuser\/albums/);

    // Click Tracks tab
    await page.locator('a[mat-tab-link]', { hasText: 'Tracks' }).click();
    await expect(page).toHaveURL(/\/user\/testuser\/tracks/);

    // Click Charts tab
    await page.locator('a[mat-tab-link]', { hasText: 'Charts' }).click();
    await expect(page).toHaveURL(/\/user\/testuser\/charts/);

    // Click Dataset tab
    await page.locator('a[mat-tab-link]', { hasText: 'Dataset' }).click();
    await expect(page).toHaveURL(/\/user\/testuser\/dataset/);
  });

  test('displays progress section', async ({ page }) => {
    await page.goto('/user/testuser/general');
    await expect(page.getByText('Statistics for testuser')).toBeVisible();
    await expect(page.locator('app-progress')).toBeVisible();
  });

  test('displays filter data button', async ({ page }) => {
    await page.goto('/user/testuser/general');
    await expect(page.getByText('Statistics for testuser')).toBeVisible();
    await expect(page.getByRole('button', { name: /Filter data/ })).toBeVisible();
  });

  test('shows user not found and can return home', async ({ page }) => {
    // For spotify, navigating to a non-existent user with no imported data redirects home
    await page.goto('/user/nonexistentuser12345xyz/general');

    // Should redirect back to home since no data was imported
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('spotifystats.app')).toBeVisible();
  });

  test('can return to home from stats page', async ({ page }) => {
    await page.goto('/user/testuser/general');
    await expect(page.getByText('Statistics for testuser')).toBeVisible();

    // Home button has matTooltip="Home" and routerLink="/"
    const homeButton = page.locator('button[mattooltip="Home"]');
    await homeButton.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('spotifystats.app')).toBeVisible();
  });
});
