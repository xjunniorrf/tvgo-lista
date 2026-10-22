// obtener_token.js
// Abre TVGO, pulsa "Ver en vivo" y guarda en token_actual.txt la primera
// URL de MDSTRM que contiene live-stream-playlist y access_token.
// Si falla, guarda en debug/ una captura de pantalla y un log de peticiones.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL_TVGO = 'https://tvgo.americatv.com.pe/';
const BOTON_SELECTOR = 'button.multilive-button';
const ARCHIVO_TOKEN = path.join(__dirname, 'token_actual.txt');
const CARPETA_DEBUG = path.join(__dirname, 'debug');
const TIMEOUT_MS = 45000;

// Dominios cuyas peticiones se registran para el diagnóstico
const DOMINIOS_DEBUG = ['mdstrm.com', 'americatv.com.pe'];

function esUrlConToken(url) {
  return url.includes('live-stream-playlist') && url.includes('access_token=');
}

// Oculta los tokens: los logs de un repo público los puede ver cualquiera
function ocultarTokens(texto) {
  return texto.replace(/(access_token|token|jwt)=[^&\s"]+/gi, '$1=<oculto>');
}

(async () => {
  const log = [];
  const registrar = (linea) => log.push(new Date().toISOString() + ' ' + ocultarTokens(linea));

  // channel 'chrome' usa el Google Chrome ya instalado (en los runners de GitHub
  // viene de serie), así no hay que descargar Chromium en cada ejecución
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  let page;
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      locale: 'es-PE',
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();

    page.on('response', (res) => {
      const url = res.url();
      if (DOMINIOS_DEBUG.some((d) => url.includes(d))) {
        registrar(`${res.status()} ${res.request().method()} ${url.slice(0, 300)}`);
      }
    });
    page.on('requestfailed', (req) => {
      registrar(`FALLO ${req.url().slice(0, 300)} -> ${req.failure()?.errorText}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        registrar(`CONSOLA ${msg.type()}: ${msg.text().slice(0, 300)}`);
      }
    });

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
    registrar('CLIC en "Ver en vivo"');
    const url = (await esperaToken).url();

    // 5. Guardar la URL
    fs.writeFileSync(ARCHIVO_TOKEN, url + '\n', 'utf8');
    console.log('URL con token capturada y guardada en ' + ARCHIVO_TOKEN);
  } catch (err) {
    console.error('Error: no se pudo capturar la URL con access_token.');
    console.error(err.message);
    process.exitCode = 1;

    // Diagnóstico: captura, texto visible y log de peticiones
    fs.mkdirSync(CARPETA_DEBUG, { recursive: true });
    if (page) {
      await page
        .screenshot({ path: path.join(CARPETA_DEBUG, 'captura.png'), fullPage: true })
        .catch((e) => registrar('No se pudo hacer la captura: ' + e.message));
      const texto = await page.locator('body').innerText().catch(() => '');
      fs.writeFileSync(path.join(CARPETA_DEBUG, 'texto_pagina.txt'), texto, 'utf8');
    }
    fs.writeFileSync(path.join(CARPETA_DEBUG, 'peticiones.log'), log.join('\n') + '\n', 'utf8');

    console.error('\n--- Últimas peticiones registradas ---');
    console.error(log.slice(-40).join('\n'));
  } finally {
    await browser.close();
  }
})();
