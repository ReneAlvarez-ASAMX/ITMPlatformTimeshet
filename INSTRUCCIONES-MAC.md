# ASADev Timesheet — Instrucciones para Mac

Esta carpeta contiene el código de la app. En Mac no se instala como un `.app` con doble clic normal (eso requeriría compilarlo desde una Mac), pero se ejecuta igual de bien corriéndolo directamente — solo hace falta Node.js instalado una vez.

## Paso 1 — Instalar Node.js (solo la primera vez)

1. Ve a [nodejs.org](https://nodejs.org).
2. Descarga la versión **LTS** para Mac (detecta automáticamente si tu Mac es Apple Silicon o Intel).
3. Abre el instalador `.pkg` descargado y sigue los pasos (Siguiente, Siguiente, Instalar).

Para comprobar que quedó instalado, abre la app **Terminal** (Spotlight → escribe "Terminal") y escribe:

```
node -v
```

Si te devuelve algo como `v22.x.x`, ya está listo.

## Paso 2 — Descomprimir y ejecutar

1. Descomprime el `.zip` que te compartieron (doble clic sobre el archivo, o clic derecho → "Abrir").
2. Entra a la carpeta descomprimida.
3. Haz doble clic en **`run-mac.command`**.

La primera vez tardará unos minutos: instala las dependencias y compila la app. Las siguientes veces abrirá casi al instante.

Si macOS muestra un aviso de seguridad ("no se puede abrir porque es de un desarrollador no identificado"):
- Clic derecho (o Control+clic) sobre `run-mac.command` → **Abrir** → confirmar **Abrir** en el cuadro de diálogo. Esto solo hay que hacerlo la primera vez.

Si en vez de eso dice que **"no es ejecutable"** (puede pasar porque el `.zip` se creó en Windows), abre Terminal, ve a la carpeta y dale permiso una vez:

```
cd ruta/a/la/carpeta/descomprimida
chmod +x run-mac.command
```

Después ya podrás abrirlo con doble clic con normalidad.

### Alternativa por Terminal

Si prefieres no usar el doble clic, puedes hacerlo manualmente desde Terminal:

```
cd ruta/a/la/carpeta/descomprimida
npm install
npm run build
npm start
```

(`npm install` y `npm run build` solo son necesarios la primera vez, o si te comparten una versión nueva del código.)

## Paso 3 — Iniciar sesión en la app

Al abrir la app por primera vez te pedirá:
- **Empresa (company URL)**: el identificador de tu empresa en ITM Platform.
- **API Key**: la tuya, personal — la encuentras en tu perfil dentro de ITM Platform.

Cada persona usa sus propias credenciales; no se comparte ninguna sesión entre usuarios.

## Notas

- No hace falta volver a ejecutar `npm install` ni `npm run build` cada vez — solo la primera vez o cuando te compartan una actualización del código (borra las carpetas `node_modules`, `dist` y `dist-electron` si quieres forzar una reinstalación completa).
- La app guarda tus cronómetros y credenciales localmente en tu Mac (cifradas usando el Llavero de macOS), de forma independiente a cualquier otro usuario.
