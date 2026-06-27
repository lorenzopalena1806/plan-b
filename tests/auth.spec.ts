import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('debe permitir iniciar sesión con credenciales correctas', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/login');
    
    // Verificar que el logo y el texto de login estén presentes
    await expect(page.locator('img[alt="Polosandia"]')).toBeVisible();
    await expect(page.getByText('Acceso Administrativo')).toBeVisible();
    
    // Llenar el formulario (credenciales de superadmin creadas en init-db.js)
    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contraseña').fill('123456');
    
    // Enviar el formulario
    await page.getByRole('button', { name: 'Ingresar' }).click();
    
    // Verificar que redirige al panel de administrador
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.getByText('Locales')).toBeVisible();
  });

  test('debe mostrar error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Usuario').fill('admin_falso');
    await page.getByLabel('Contraseña').fill('clave_mala');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    
    // Verificar el mensaje de error
    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    // Verificar que seguimos en la página de login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
