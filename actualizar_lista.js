// actualizar_lista.js
// Lee token_actual.txt y genera lista.m3u a partir de plantilla.m3u,
// reemplazando el placeholder {{TOKEN_URL}} por la URL capturada.
const fs = require('fs');
const path = require('path');

const ARCHIVO_TOKEN = path.join(__dirname, 'token_actual.txt');
const ARCHIVO_PLANTILLA = path.join(__dirname, 'plantilla.m3u');
const ARCHIVO_LISTA = path.join(__dirname, 'lista.m3u');
const PLACEHOLDER = '{{TOKEN_URL}}';

function salirConError(mensaje) {
  console.error('Error: ' + mensaje);
  process.exit(1);
}

if (!fs.existsSync(ARCHIVO_TOKEN)) {
  salirConError('no existe token_actual.txt. Ejecuta primero obtener_token.js');
}
if (!fs.existsSync(ARCHIVO_PLANTILLA)) {
  salirConError('no existe plantilla.m3u');
}

const url = fs.readFileSync(ARCHIVO_TOKEN, 'utf8').trim();
if (!url.startsWith('https://') || !url.includes('access_token=')) {
  salirConError('token_actual.txt no contiene una URL válida con access_token');
}

const plantilla = fs.readFileSync(ARCHIVO_PLANTILLA, 'utf8');
if (!plantilla.includes(PLACEHOLDER)) {
  salirConError('plantilla.m3u no contiene el placeholder ' + PLACEHOLDER);
}

// split/join reemplaza todas las apariciones sin interpretar caracteres especiales
const lista = plantilla.split(PLACEHOLDER).join(url);
fs.writeFileSync(ARCHIVO_LISTA, lista, 'utf8');
console.log('Lista generada en ' + ARCHIVO_LISTA);
