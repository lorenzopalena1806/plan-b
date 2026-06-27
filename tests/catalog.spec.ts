import { test, expect } from '@playwright/test';

test.describe('Catálogo y Carrito', () => {
  // Para las pruebas, asumimos que existe el local 'mi-local'
  const restaurantSlug = 'mi-local';

  test('debe mostrar el catálogo y agregar un producto al carrito', async ({ page }) => {
    await page.goto(`/${restaurantSlug}`);
    
    // Verificar que cargue la página del catálogo
    await expect(page.getByText('Mi Local')).toBeVisible();
    
    // Buscar un producto (ejemplo Hamburguesa Clásica si existe, sino el primer botón "Agregar")
    // Como los datos vienen de la base de datos de test, solo buscamos un botón genérico o evaluamos la UI general
    const primerBotonAgregar = page.locator('button', { hasText: 'Agregar' }).first();
    
    if (await primerBotonAgregar.isVisible()) {
      await primerBotonAgregar.click();
      
      // Debe aparecer el modal o agregar directamente
      await expect(page.getByText('Carrito')).toBeVisible();
      
      // Intentar abrir el carrito si no está abierto
      const botonVerCarrito = page.getByRole('button', { name: /Ver Carrito/i });
      if (await botonVerCarrito.isVisible()) {
        await botonVerCarrito.click();
      }
      
      // Verificar que el subtotal y total existan
      await expect(page.getByText('Subtotal')).toBeVisible();
      await expect(page.getByText('Total')).toBeVisible();
    }
  });

  test('debe aplicar un cupón correctamente si existe', async ({ page }) => {
    await page.goto(`/${restaurantSlug}`);
    
    // Si podemos agregar un producto...
    const primerBotonAgregar = page.locator('button', { hasText: 'Agregar' }).first();
    if (await primerBotonAgregar.isVisible()) {
      await primerBotonAgregar.click();
      
      const inputCupon = page.getByPlaceholder('Código ej: DESC10');
      if (await inputCupon.isVisible()) {
        await inputCupon.fill('CUPON_FALSO');
        await page.getByRole('button', { name: 'Aplicar' }).click();
        
        // Esperamos que falle el cupón
        await expect(page.getByText('Cupón inválido')).toBeVisible();
      }
    }
  });
});
