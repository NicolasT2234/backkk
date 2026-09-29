import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5173/login');

    // Wait for the login form to be visible
    await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();

    // Fill in the login form with test credentials
    await page.fill('input[placeholder="ejemplo@correo.com"]', 'admin@sicrcb.com');
    await page.fill('input[placeholder="Digita tu contraseña"]', 'admin123');

    // Submit the form
    await page.click('button:has-text("Ingresar al Sistema")');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('http://localhost:5173/dashboard/', { timeout: 10000 });

    // Verify dashboard is loaded by checking for dashboard-specific elements
    await expect(page.locator('text=SICRCB Dashboard')).toBeVisible();
    await expect(page.locator('text=Bienvenido de nuevo')).toBeVisible();
  });

  test('should logout successfully and return to login page', async ({ page }) => {
    // First login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder="ejemplo@correo.com"]', 'admin@sicrcb.com');
    await page.fill('input[placeholder="Digita tu contraseña"]', 'admin123');
    await page.click('button:has-text("Ingresar al Sistema")');

    // Wait for dashboard
    await expect(page).toHaveURL('http://localhost:5173/dashboard/', { timeout: 10000 });

    // Click on logout button (assuming it's in the navbar)
    await page.click('button:has-text("Cerrar Sesión")');

    // Wait for redirect to login or home page
    await expect(page).toHaveURL(/.*\/(login|$)/, { timeout: 10000 });

    // Verify we're back on login page
    await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');

    // Fill in invalid credentials
    await page.fill('input[placeholder="ejemplo@correo.com"]', 'invalid@test.com');
    await page.fill('input[placeholder="Digita tu contraseña"]', 'wrongpass');

    // Submit the form
    await page.click('button:has-text("Ingresar al Sistema")');

    // Wait for error message
    await expect(page.locator('text=Error al iniciar sesión')).toBeVisible({ timeout: 5000 });
  });
});