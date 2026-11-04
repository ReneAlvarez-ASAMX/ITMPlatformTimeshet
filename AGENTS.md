# AGENTS.md

Instrucciones para asistentes de IA que trabajan en este repositorio. El porqué de cada regla está en [ESTANDARES-DE-INGENIERIA.md](ESTANDARES-DE-INGENIERIA.md).

## El proyecto

App de escritorio (Electron + React + Vite + TypeScript) para registrar horas y enviarlas a ITM Platform.

- `electron/`: proceso principal. Es el único que llama a la API de ITM Platform (`itmClient.ts`) y guarda la API Key cifrada (`store.ts`).
- `src/`: interfaz en React. Habla con el proceso principal solo a través del puente `window.itm` (`electron/preload.ts`, tipos en `src/electron-bridge.d.ts`).
- La lógica pura va en módulos sin React (`src/timerLogic.ts`, `src/duration.ts`, `src/timeFormat.ts`, `electron/sendResult.ts`) para poder probarla de forma aislada.

## Comandos

- `npm test`: tests unitarios con Vitest (`npm run test:watch` en modo observación).
- `npm run typecheck`: comprobación de tipos del renderer y de Electron.
- `npm run build`: build completo.
- `npm run dev`: arranca la app en desarrollo.

## Reglas

### Tests

- Los datos de horas no se pueden reconstruir: un cambio que pueda perder o duplicar tiempo necesita test.
- TDD para la lógica principal (cálculo de tiempos, sincronización, reintentos): primero un test que falla y describe el comportamiento esperado, después el código. Los casos límite pueden añadirse después.
- Para corregir un fallo, primero un test que lo reproduzca.
- Los tests van junto al código: `modulo.ts` → `modulo.test.ts`.
- Unitarios con las dependencias externas simuladas (por ejemplo, `window.itm`). La mayoría de los tests deben ser unitarios.
- Integración solo contra un entorno que no sea producción (por ejemplo, demo), y borrando todo lo que creen.
- E2E (Playwright) solo para los recorridos críticos: abrir, iniciar un temporizador, enviar horas.
- No escribir tests que fijen un comportamiento que un ticket abierto describe como fallo.

### Antes de dar un cambio por terminado

1. Ejecutar `npm test`, `npm run typecheck` y `npm run build`. Si algo ya fallaba antes del cambio, decirlo aparte.
2. Los cambios visibles se prueban en la app, no solo en los tests.
3. Si el cambio escribe en un sistema externo (por ejemplo, enviar horas), verificarlo leyendo de nuevo el resultado.

Todavía no hay lint ni CI que ejecute los tests; cuando existan, se añaden a esta lista.

### Cambios

- Antes de añadir código, buscar si ya existe algo parecido y seguir el mismo patrón.
- El cambio más pequeño que resuelva el problema.
- Un tema por PR. Mensajes de commit breves que digan qué cambia.
- Las releases se publican con una etiqueta `vX.Y.Z` que debe coincidir con `version` de `package.json`.

### Documentación

- `README.md`: cómo es la app hoy, cómo instalarla y usarla, y qué endpoints de ITM Platform usa.
- `zz_Specifications/`: especificaciones de funcionalidades planificadas.
- `zz_Tickets/`: incidencias, investigaciones y fallos, con nombre `AAAA-MM-DD-tema.md`.
- Al terminar un ticket o especificación, moverlo a `done/` con su estado final y cómo se verificó. Si se descarta, a `rejected/`.
- Escribir en presente y de forma breve: cómo funciona la app ahora. El historial está en Git.
- En Markdown, un párrafo o elemento de lista por línea, sin ajustar a mano.

### Seguridad

- Nunca poner claves, tokens ni contraseñas en documentos, código, tests ni logs.
- Las credenciales se guardan cifradas con el almacén del sistema operativo (`safeStorage`).
- No relajar `contextIsolation`, `sandbox`, la CSP, el bloqueo de navegación ni la lista blanca de enlaces externos.
- Las llamadas a la API se hacen solo desde el proceso principal.
- Mantener las dependencias en versiones con soporte, en especial Electron.
