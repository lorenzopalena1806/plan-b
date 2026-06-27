# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog.spec.ts >> Catálogo y Carrito >> debe mostrar el catálogo y agregar un producto al carrito
- Location: tests\catalog.spec.ts:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Mi Local')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Mi Local')

```

```yaml
- main:
  - heading "404" [level=1]
  - heading "This page could not be found." [level=2]
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Catálogo y Carrito', () => {
  4  |   // Para las pruebas, asumimos que existe el local 'mi-local'
  5  |   const restaurantSlug = 'mi-local';
  6  | 
  7  |   test('debe mostrar el catálogo y agregar un producto al carrito', async ({ page }) => {
  8  |     await page.goto(`/${restaurantSlug}`);
  9  |     
  10 |     // Verificar que cargue la página del catálogo
> 11 |     await expect(page.getByText('Mi Local')).toBeVisible();
     |                                              ^ Error: expect(locator).toBeVisible() failed
  12 |     
  13 |     // Buscar un producto (ejemplo Hamburguesa Clásica si existe, sino el primer botón "Agregar")
  14 |     // Como los datos vienen de la base de datos de test, solo buscamos un botón genérico o evaluamos la UI general
  15 |     const primerBotonAgregar = page.locator('button', { hasText: 'Agregar' }).first();
  16 |     
  17 |     if (await primerBotonAgregar.isVisible()) {
  18 |       await primerBotonAgregar.click();
  19 |       
  20 |       // Debe aparecer el modal o agregar directamente
  21 |       await expect(page.getByText('Carrito')).toBeVisible();
  22 |       
  23 |       // Intentar abrir el carrito si no está abierto
  24 |       const botonVerCarrito = page.getByRole('button', { name: /Ver Carrito/i });
  25 |       if (await botonVerCarrito.isVisible()) {
  26 |         await botonVerCarrito.click();
  27 |       }
  28 |       
  29 |       // Verificar que el subtotal y total existan
  30 |       await expect(page.getByText('Subtotal')).toBeVisible();
  31 |       await expect(page.getByText('Total')).toBeVisible();
  32 |     }
  33 |   });
  34 | 
  35 |   test('debe aplicar un cupón correctamente si existe', async ({ page }) => {
  36 |     await page.goto(`/${restaurantSlug}`);
  37 |     
  38 |     // Si podemos agregar un producto...
  39 |     const primerBotonAgregar = page.locator('button', { hasText: 'Agregar' }).first();
  40 |     if (await primerBotonAgregar.isVisible()) {
  41 |       await primerBotonAgregar.click();
  42 |       
  43 |       const inputCupon = page.getByPlaceholder('Código ej: DESC10');
  44 |       if (await inputCupon.isVisible()) {
  45 |         await inputCupon.fill('CUPON_FALSO');
  46 |         await page.getByRole('button', { name: 'Aplicar' }).click();
  47 |         
  48 |         // Esperamos que falle el cupón
  49 |         await expect(page.getByText('Cupón inválido')).toBeVisible();
  50 |       }
  51 |     }
  52 |   });
  53 | });
  54 | 
```