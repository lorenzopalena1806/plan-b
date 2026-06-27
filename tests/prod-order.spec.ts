const { test, expect } = require('@playwright/test');

test('Realizar 4 pedidos en paralelo en producción', async ({ browser }) => {
  const numOrders = 4;
  
  // Creamos 4 contextos diferentes para que corran en paralelo
  const promises = Array.from({ length: numOrders }).map(async (_, i) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 1. Ir a la tienda
    await page.goto('https://polosandia.vercel.app/lo-del-pela');
    
    // 2. Esperar que carguen los productos
    const productCards = page.locator('.hover-card');
    await productCards.first().waitFor({ state: 'visible' });
    
    // 3. Abrir el primer producto
    await productCards.first().click();
    
    // 4. Aumentar cantidad a 4 (más de 3 productos)
    const botonMas = page.getByRole('button', { name: '+' });
    await botonMas.waitFor({ state: 'visible' });
    await botonMas.click();
    await botonMas.click();
    await botonMas.click();
    
    // 5. Agregar al carrito
    const botonAgregar = page.locator('.modal-content .btn-primary');
    await botonAgregar.click();
    
    // 6. Si hay botón de Ver Mi Pedido (en mobile), hacer clic, si no, ya está a la vista
    const btnVerPedido = page.getByRole('button', { name: /Ver (Mi Pedido|Carrito)/i });
    if (await btnVerPedido.isVisible()) {
      await btnVerPedido.click();
    }
    
    // 7. Llenar formulario
    const inputNombre = page.getByPlaceholder('Tu Nombre');
    await inputNombre.waitFor({ state: 'visible' });
    await inputNombre.fill(`Cliente Test de Carga ${i + 1}`);
    
    // Seleccionar Retiro para no llenar dirección
    await page.getByRole('button', { name: 'Retiro' }).click();
    
    // 8. Enviar pedido
    const btnConfirmar = page.getByRole('button', { name: 'Confirmar Pedido' });
    
    // Esperamos a que la petición inicie y termine interceptando el popup a wa.me o nav
    // Dado que se abre whatsapp, capturamos el destino
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('api/public/') && req.method() === 'POST'),
      btnConfirmar.click()
    ]);
    
    console.log(`Pedido ${i + 1} enviado exitosamente a la base de datos.`);
    
    await context.close();
  });

  await Promise.all(promises);
  console.log('¡Los 4 pedidos paralelos se completaron con éxito!');
});
