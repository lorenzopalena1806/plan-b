const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('./screenshots/deep_test')) {
    fs.mkdirSync('./screenshots/deep_test', { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const baseUrl = 'https://polosandia.vercel.app';

  try {
    console.log('--- PASO 1: Login como Empleado de Caja ---');
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"], input[name="email"], input[type="text"]', 'pela2');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    console.log('--- PASO 2: Ir al Punto de Venta (POS) ---');
    await page.goto(`${baseUrl}/admin/caja/pos`);
    await page.waitForTimeout(3000);
    
    // Tomar captura inicial del POS
    await page.screenshot({ path: './screenshots/deep_test/1_POS_Abierto.png' });

    console.log('--- PASO 3: Agregando el primer producto que veamos al carrito ---');
    // Esperar a que carguen los productos de la API
    await page.waitForTimeout(4000); // Darle tiempo puro para cargar todo
    
    // Buscamos el primer botón de producto
    const productCards = await page.$$('button:has(.text-bold)');
    if (productCards.length > 0) {
      await productCards[0].click();
      await page.waitForTimeout(1000); // Si abre modal, damos un segundo
      // Si se abre un modal de modificadores, le damos a "Agregar" o click afuera
      const addModalBtn = await page.$('button:has-text("Agregar al Ticket")');
      if (addModalBtn) await addModalBtn.click();
    } else {
      console.log('No hay productos en pantalla para clickear.');
      // Omitir intento alternativo para no colgar el script
    }
    await page.waitForTimeout(1500);
    
    console.log('--- PASO 4: Completando nombre de cliente y cobrando ---');
    await page.fill('input[placeholder*="Nombre del cliente"]', 'Cliente de Prueba Automático');
    
    // Click en botón Efectivo si es necesario seleccionarlo
    const btnEfectivo = await page.$('button:has-text("Efectivo")');
    if (btnEfectivo) await btnEfectivo.click();
    
    await page.screenshot({ path: './screenshots/deep_test/2_Carrito_Lleno.png' });

    // Click en Cobrar
    await page.click('button:has-text("Enviar a Cocina")');
    await page.waitForTimeout(4000); // Esperamos que procese la base de datos
    
    await page.screenshot({ path: './screenshots/deep_test/3_Venta_Exitosa.png' });
    console.log('✔️ Venta de prueba generada en la Base de Datos.');

    console.log('--- PASO 5: Cerrar sesión e iniciar como Superadmin ---');
    await context.clearCookies();
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="username"], input[name="email"], input[type="text"]', 'programador');
    await page.fill('input[type="password"]', 'programador123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    console.log('--- PASO 6: Ir a Historial de Ventas y buscar la de prueba ---');
    await page.goto(`${baseUrl}/admin/sales`);
    await page.waitForTimeout(4000);
    
    // Tomamos foto del historial con la venta
    await page.screenshot({ path: './screenshots/deep_test/4_Venta_En_Historial.png', fullPage: true });

    console.log('--- PASO 7: Eliminando la venta de prueba ---');
    // Buscamos el tachito de basura de la venta de prueba. 
    // Usamos el texto "Cliente de Prueba Automático" para localizar la fila y hacer click en su respectivo botón eliminar.
    
    // Este evento es para aceptar el popup de confirmación nativo de JS (confirm('¿Estás seguro...'))
    page.on('dialog', async dialog => {
      console.log('Aceptando cartel de confirmación de borrado...');
      await dialog.accept();
    });

    const row = await page.$(':text-matches("Cliente de Prueba Automático") >> ..');
    if (row) {
      const deleteBtn = await row.$('button');
      if (deleteBtn) {
        await deleteBtn.click();
        await page.waitForTimeout(4000);
        console.log('✔️ Venta de prueba eliminada de la Base de Datos.');
      }
    } else {
      console.log('⚠️ No se pudo localizar automáticamente el botón de borrar. Quizás requiera borrado manual.');
    }
    
    await page.screenshot({ path: './screenshots/deep_test/5_Historial_Limpio.png', fullPage: true });

  } catch(e) {
    console.error('❌ Ocurrió un error durante el testeo profundo:', e.message);
    await page.screenshot({ path: './screenshots/deep_test/Error_Critico.png' });
  }

  await browser.close();
  console.log('¡Testeo PROFUNDO completado!');
})();
