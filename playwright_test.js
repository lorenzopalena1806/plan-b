const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('./screenshots')) {
    fs.mkdirSync('./screenshots');
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000); // 20 seconds

  const baseUrl = 'https://polosandia.vercel.app';

  async function loginAndScreenshot(username, password, roleName) {
    try {
      console.log(`Testando rol: ${roleName}`);
      await page.goto(`${baseUrl}/login`);
      await page.waitForLoadState('networkidle');
      
      // Try to find the username/email input
      const usernameInput = await page.$('input[name="username"], input[name="email"], input[type="text"], input[type="email"]');
      if (usernameInput) {
        await usernameInput.fill(username);
      } else {
        console.error(`No se encontró el campo de usuario para ${roleName}`);
        return;
      }

      // Try to find the password input
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      if (passwordInput) {
        await passwordInput.fill(password);
      } else {
        console.error(`No se encontró el campo de contraseña para ${roleName}`);
        return;
      }

      // Try to find the submit button
      const submitBtn = await page.$('button[type="submit"], form button');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        console.error(`No se encontró el botón de submit para ${roleName}`);
        return;
      }
      
      console.log(`Iniciando sesión como ${username}...`);
      await page.waitForTimeout(5000); // Wait for redirect
      
      // Attempt to navigate to admin panel
      await page.goto(`${baseUrl}/admin`);
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: `./screenshots/${roleName}_dashboard.png`, fullPage: true });
      console.log(`✔️  ${roleName} completado con éxito. (Captura guardada)`);
      
      // Clear cookies for next login
      await page.context().clearCookies();
    } catch (e) {
      console.error(`❌ Error en rol ${roleName}:`, e.message);
      await page.screenshot({ path: `./screenshots/${roleName}_error.png` });
    }
  }

  await loginAndScreenshot('programador', 'programador123', 'Superadmin');
  await loginAndScreenshot('pela', 'admin', 'Admin_Local');
  await loginAndScreenshot('pela2', 'admin', 'Caja');

  console.log('Iniciando test de vista pública (Cliente)...');
  try {
    await page.goto(baseUrl);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: './screenshots/Cliente_Catalogo.png', fullPage: true });
    console.log('✔️  Test de cliente completado. (Captura guardada)');
  } catch(e) {
    console.error('❌ Error test cliente:', e.message);
  }

  await browser.close();
  console.log('¡Todos los tests finalizaron!');
})();
