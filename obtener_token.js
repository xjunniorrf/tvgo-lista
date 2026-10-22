// obtener_token.js
// Abre TVGO, pulsa "Ver en vivo" y guarda en token_actual.txt la primera
// URL de MDSTRM que contiene live-stream-playlist y access_token.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL_TVGO = 'https://tvgo.americatv.com.pe/';
const BOTON_SELECTOR = 'button.multilive-button';
const ARCHIVO_TOKEN = path.join(__dirname, 'token_actual.txt');
const TIMEOUT_MS = 45000;

function esUrlConToken(url) {
  return url.includes('live-stream-playlist') && url.includes('access_token=');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      locale: 'es-PE',
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // 1. Abrir la página
    await page.goto(URL_TVGO, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 2. Esperar el botón "Ver en vivo"
    const boton = page.locator(BOTON_SELECTOR).first();
    await boton.waitFor({ state: 'visible', timeout: TIMEOUT_MS });

    // 3. Preparar la espera ANTES del clic para no perder la primera petición
    const esperaToken = page.waitForRequest((req) => esUrlConToken(req.url()), {
      timeout: TIMEOUT_MS
    });

    // 4. Clic y captura de la URL completa
    await boton.click();
    const url = (await esperaToken).url();

    // 5. Guardar la URL
    fs.writeFileSync(ARCHIVO_TOKEN, url + '\n', 'utf8');
    console.log('URL con token capturada y guardada en ' + ARCHIVO_TOKEN);
  } catch (err) {
    console.error('Error: no se pudo capturar la URL con access_token.');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
