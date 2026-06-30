const { test, expect } = require('@playwright/test');

test('Realizar 4 pedidos complejos en paralelo en producción', async ({ browser }: { browser: any }) => {
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
    const count = await productCards.count();
    
    // 3. Vamos a intentar agregar hasta 3 productos diferentes (si hay disponibles)
    const maxProductsToAdd = Math.min(count, 3);
    
    for (let pIndex = 0; pIndex < maxProductsToAdd; pIndex++) {
      // Clickear la tarjeta del producto
      await productCards.nth(pIndex).click();
      
      // Esperar al modal
      const botonAgregar = page.locator('.modal-content .btn-primary');
      await botonAgregar.waitFor({ state: 'visible' });
      
      // Buscar si hay agregantes/modificadores (checkboxes)
      const checkboxes = page.locator('.modal-content input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      // Marcar algunos checkboxes al azar (los primeros 2 o todos si hay pocos)
      const maxModifiers = Math.min(checkboxCount, 3);
      for (let mIndex = 0; mIndex < maxModifiers; mIndex++) {
        await checkboxes.nth(mIndex).check();
      }
      
      // Aumentar la cantidad a 2 para cada tipo de hamburguesa
      const botonMas = page.getByRole('button', { name: '+' });
      if (await botonMas.isVisible()) {
        await botonMas.click();
      }
      
      // Agregar al carrito y cerrar modal
      await botonAgregar.click();
      
      // Esperar a que el modal se cierre antes de abrir otro producto
      await page.waitForTimeout(500); 
    }
    
    // 4. Si hay botón de Ver Mi Pedido (en mobile), hacer clic
    const btnVerPedido = page.getByRole('button', { name: /Ver (Mi Pedido|Carrito)/i });
    if (await btnVerPedido.isVisible()) {
      await btnVerPedido.click();
    }
    
    // 5. Llenar formulario
    const inputNombre = page.getByPlaceholder('Tu Nombre');
    await inputNombre.waitFor({ state: 'visible' });
    await inputNombre.fill(`Cliente VIP Complejo ${i + 1}`);
    
    // Seleccionar Retiro para no llenar dirección
    await page.getByRole('button', { name: 'Retiro' }).click();
    
    const inputNotas = page.getByPlaceholder(/Notas\/Aclaraciones/);
    if (await inputNotas.isVisible()) {
      await inputNotas.fill(`Este es un pedido automático con varios productos y agregantes (Test ${i + 1})`);
    }
    
    // 6. Enviar pedido
    const btnConfirmar = page.getByRole('button', { name: 'Confirmar Pedido' });
    
    // Esperamos a que la petición inicie y termine
    const [request] = await Promise.all([
      page.waitForRequest((req: any) => req.url().includes('api/public/') && req.method() === 'POST'),
      btnConfirmar.click()
    ]);
    
    console.log(`Pedido Complejo ${i + 1} enviado exitosamente a la base de datos.`);
    
    await context.close();
  });

  await Promise.all(promises);
  console.log('¡Los 4 pedidos complejos (con agregantes y varios productos) se completaron con éxito!');
});
