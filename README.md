# TVGO → lista.m3u

Captura cada 10 minutos la URL con `access_token` del directo de TVGO (MDSTRM) y la publica en `lista.m3u`.

## Estructura del repositorio

```
tu-repo/
├── .github/
│   └── workflows/
│       └── token.yml        # workflow programado (cada 10 min)
├── .gitignore               # ignora node_modules y token_actual.txt
├── actualizar_lista.js      # plantilla.m3u + token -> lista.m3u
├── obtener_token.js         # Playwright: captura la URL con token
├── package.json
├── package-lock.json        # obligatorio: el workflow usa "npm ci"
├── plantilla.m3u            # contiene el placeholder {{TOKEN_URL}}
└── lista.m3u                # generado y commiteado por el workflow
```

## Uso local

```bash
npm install
npx playwright install chromium
npm start
```

`npm start` ejecuta `obtener_token.js` y luego `actualizar_lista.js`.

## Puesta en marcha en GitHub

1. Crea un repositorio nuevo (recomendado: **privado**).
2. Sube todos los archivos de arriba, incluido `package-lock.json`.
3. En **Settings → Actions → General → Workflow permissions**, marca **Read and write permissions** y guarda.
4. Ve a la pestaña **Actions**, abre "Actualizar token y lista M3U" y pulsa **Run workflow** para probarlo la primera vez.
5. A partir de ahí se ejecuta solo cada 10 minutos.

URL de la lista para tu reproductor (repo público):

```
https://raw.githubusercontent.com/<usuario>/<repo>/main/lista.m3u
```

## Notas

- El cron de GitHub no es exacto: puede retrasarse varios minutos en horas de carga.
- GitHub desactiva los workflows programados tras 60 días sin actividad en el repo.
- Si TVGO cambia la clase del botón (`multilive-button`) o la URL de MDSTRM, ajusta las constantes al inicio de `obtener_token.js`.
- Para añadir más canales, agrega más entradas `#EXTINF` en `plantilla.m3u`.
