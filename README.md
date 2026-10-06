# ITM Platform Timesheet

App de escritorio (Windows y macOS) para registrar tiempo dedicado a tus tareas asignadas en ITM Platform, con cronómetros y envío de horas a la plataforma.

## Requisitos

- Node.js 18+ (ya instalado en este equipo).
- Una API Key de ITM Platform (perfil de usuario → API Key) y el identificador de tu empresa (company URL).

## Desarrollo

```bash
npm install
npm run dev
```

Esto abre la app en una ventana de Electron con recarga en caliente del renderer.

## Comprobar tipos

```bash
npm run typecheck
```

## Generar el instalador de Windows (.exe)

```bash
npm run package
```

El instalador NSIS se genera en `release/`.

## Generar el instalador de macOS (.dmg)

El build de macOS requiere compilar en una máquina Mac real (electron-builder no puede generar el `.dmg` desde Windows). Este repo incluye un workflow de GitHub Actions (`.github/workflows/build-mac.yml`) que compila el `.dmg`/`.zip` en un runner macOS cada vez que se hace push a `main` o se lanza manualmente desde la pestaña **Actions** de GitHub. El resultado queda disponible como artifact descargable de esa ejecución.

## Publicar una nueva versión (actualización automática)

La app instalada en Windows consulta las *Releases* de este repositorio, avisa si hay una versión más nueva y deja al usuario descargarla e instalarla desde el botón de versión de la cabecera (`v1.x.x`). En macOS no hay actualización automática porque la app no está firmada.

1. Sube la versión en `package.json` (por ejemplo `npm version minor --no-git-tag-version`) y llévala a `main` con un PR.
2. Crea y sube la etiqueta con el **mismo** número:

   ```bash
   git checkout main && git pull
   git tag v1.2.0
   git push origin v1.2.0
   ```

3. El workflow `Release Windows` (`.github/workflows/release-win.yml`) compila el instalador y lo publica como Release junto con `latest.yml`. Falla si la etiqueta no coincide con la versión de `package.json`.
4. Las apps instaladas lo detectan en la siguiente comprobación (al arrancar y cada 4 horas) o al pulsar "Buscar actualizaciones".

Notas:
- Mientras el repositorio sea **privado**, la app no puede leer las Releases y la comprobación falla en silencio. Funcionará al hacerlo público (no se incluye ningún token en el instalador a propósito).
- Las instalaciones anteriores a la 1.1.0 no traen el actualizador: hay que instalar una vez la 1.1.0 a mano.

## Cómo funciona

- **Login**: se guarda el `company` y la API Key cifrados en disco (via `safeStorage` de Electron, que usa el almacén de credenciales de Windows).
- **Tareas**: se obtienen desde `GET /timehours` de ITM Platform, que devuelve tus tareas asignadas para reportar tiempo junto con las horas ya reportadas de cada día.
- **Cronómetros**: puedes iniciar varios cronómetros a la vez, uno por tarea. El progreso se guarda localmente para sobrevivir a cierres inesperados.
- **Envío de horas**: al pulsar "Enviar horas a ITM Platform", se consulta el valor ya reportado en el servidor y se suma el tiempo local antes de enviarlo (la API de ITM Platform reemplaza el total del día, no lo suma).
- **Recordatorios**: dos avisos configurables desde el botón "Recordatorios": uno si no hay ningún temporizador activo (por defecto cada 5 min) y otro que pregunta si sigues trabajando mientras haya un temporizador activo (por defecto cada 15 min, contados desde que arranca cada temporizador).
- **Destacadas diarias**: al iniciar la app pregunta si quieres reestablecer tu lista de tareas destacadas (la prioridad cambia cada día). Si respondes que sí, muestra las tareas agrupadas por proyecto solo con la estrella para marcarlas; "Cancelar" conserva la lista anterior. La pregunta se hace una vez por arranque.
- **Inicio automático**: el botón "Inicio automático" registra la app para arrancar al iniciar sesión en el sistema (solo en la app instalada, no en `npm run dev`). Al arrancar así, la app queda en la bandeja sin abrir la ventana.
- La app se minimiza a la bandeja del sistema en lugar de cerrarse; el icono de la bandeja indica cuántos cronómetros están activos.
