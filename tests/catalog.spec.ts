import { test, expect } from '@playwright/test';

test.describe('Catálogo y Carrito', () => {
  // Para las pruebas, asumimos que existe el local 'mi-local'
  const restaurantSlug = 'pepe-burger';

  test('debe mostrar el catálogo y agregar un producto al carrito', async ({ page }) => {
    await page.goto(`/${restaurantSlug}`);
    
    // Buscar la tarjeta del producto y hacer clic
    const productoCard = page.getByText('Doble Queso');
    await expect(productoCard).toBeVisible({ timeout: 10000 });
    await productoCard.click();
      
    // En el modal, hacer clic en Agregar
    const botonModalAgregar = page.locator('.modal-content .btn-primary');
    await expect(botonModalAgregar).toBeVisible();
    await botonModalAgregar.click();
      
    // Intentar abrir el carrito si no está abierto (dependiendo de la UI mobile/desktop)
    const botonVerCarrito = page.getByRole('button', { name: /Ver Carrito/i });
    if (await botonVerCarrito.isVisible()) {
      await botonVerCarrito.click();
    }
    
    // Verificar que el subtotal y total existan
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Total')).toBeVisible();
  });

  test('debe aplicar un cupón correctamente si existe', async ({ page }) => {
    await page.goto(`/${restaurantSlug}`);
    
    // Buscar la tarjeta del producto y hacer clic
    const productoCard = page.getByText('Doble Queso');
    await expect(productoCard).toBeVisible({ timeout: 10000 });
    await productoCard.click();
      
    // En el modal, hacer clic en Agregar
    const botonModalAgregar = page.locator('.modal-content .btn-primary');
    await expect(botonModalAgregar).toBeVisible();
    await botonModalAgregar.click();
      
    const inputCupon = page.getByPlaceholder('Código ej: DESC10');
    if (await inputCupon.isVisible()) {
      await inputCupon.fill('CUPON_FALSO');
      await page.getByRole('button', { name: 'Aplicar' }).click();
      
      // Esperamos que falle el cupón
      await expect(page.getByText('Cupón inválido')).toBeVisible();
    }
  });
});
