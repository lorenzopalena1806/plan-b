# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Autenticación >> debe permitir iniciar sesión con credenciales correctas
- Location: tests\auth.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Usuario')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - img "Polosandia" [ref=e6]
      - heading "Acceso Administrativo" [level=2] [ref=e7]
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Usuario
          - textbox [ref=e11]
        - generic [ref=e12]:
          - generic [ref=e13]: Contraseña
          - textbox [ref=e14]
        - button "Ingresar" [ref=e15] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e21] [cursor=pointer]:
    - img [ref=e22]
  - alert [ref=e25]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Autenticación', () => {
  4  |   test('debe permitir iniciar sesión con credenciales correctas', async ({ page }) => {
  5  |     // Ir a la página de login
  6  |     await page.goto('/login');
  7  |     
  8  |     // Verificar que el logo y el texto de login estén presentes
  9  |     await expect(page.locator('img[alt="Polosandia"]')).toBeVisible();
  10 |     await expect(page.getByText('Acceso Administrativo')).toBeVisible();
  11 |     
  12 |     // Llenar el formulario (credenciales de superadmin creadas en init-db.js)
> 13 |     await page.getByLabel('Usuario').fill('admin');
     |                                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  14 |     await page.getByLabel('Contraseña').fill('123456');
  15 |     
  16 |     // Enviar el formulario
  17 |     await page.getByRole('button', { name: 'Ingresar' }).click();
  18 |     
  19 |     // Verificar que redirige al panel de administrador
  20 |     await expect(page).toHaveURL(/.*\/admin/);
  21 |     await expect(page.getByText('Locales')).toBeVisible();
  22 |   });
  23 | 
  24 |   test('debe mostrar error con credenciales incorrectas', async ({ page }) => {
  25 |     await page.goto('/login');
  26 |     
  27 |     await page.getByLabel('Usuario').fill('admin_falso');
  28 |     await page.getByLabel('Contraseña').fill('clave_mala');
  29 |     await page.getByRole('button', { name: 'Ingresar' }).click();
  30 |     
  31 |     // Verificar el mensaje de error
  32 |     await expect(page.getByText('Credenciales inválidas')).toBeVisible();
  33 |     // Verificar que seguimos en la página de login
  34 |     await expect(page).toHaveURL(/.*\/login/);
  35 |   });
  36 | });
  37 | 
```