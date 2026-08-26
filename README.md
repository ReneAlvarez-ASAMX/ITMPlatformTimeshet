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

## Cómo funciona

- **Login**: se guarda el `company` y la API Key cifrados en disco (via `safeStorage` de Electron, que usa el almacén de credenciales de Windows).
- **Tareas**: se obtienen desde `GET /timehours` de ITM Platform, que devuelve tus tareas asignadas para reportar tiempo junto con las horas ya reportadas de cada día.
- **Cronómetros**: puedes iniciar varios cronómetros a la vez, uno por tarea. El progreso se guarda localmente para sobrevivir a cierres inesperados.
- **Envío de horas**: al pulsar "Enviar horas a ITM Platform", se consulta el valor ya reportado en el servidor y se suma el tiempo local antes de enviarlo (la API de ITM Platform reemplaza el total del día, no lo suma).
- La app se minimiza a la bandeja del sistema en lugar de cerrarse; el icono de la bandeja indica cuántos cronómetros están activos.
