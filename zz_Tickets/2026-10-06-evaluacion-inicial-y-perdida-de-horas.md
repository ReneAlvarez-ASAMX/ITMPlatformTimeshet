# Ticket: evaluación inicial de la app y pérdida de horas al sincronizar

## Estado

**Abierto (2026-10-06).** Evaluación de la versión 1.1.1 (`23b9c8b`) hecha por ITM Platform. Los dos fallos de pérdida de horas (§1) bloquean recomendar o distribuir la app. El resto son mejoras por orden de prioridad.

Los criterios de referencia están en [ESTANDARES-DE-INGENIERIA.md](../ESTANDARES-DE-INGENIERIA.md).

## Verificación realizada

- `npm run typecheck` y el build completo pasan.
- `npm audit`: 24 vulnerabilidades (1 crítica, 18 altas). La mayoría están en herramientas de build; Electron (alta) y `js-yaml` van dentro de la app instalada.
- El fallo 1.1 se reprodujo con un test que ejecuta el hook real `useTimers`. El fallo 1.2 está confirmado leyendo el código de la app y el comportamiento de la API.
- No se ejecutó la app de Electron ni se hicieron llamadas a la API.

## 1. Pérdida de horas (prioridad máxima)

### 1.1 Sincronizar con un temporizador en marcha pierde tiempo

En `TimesheetScreen.tsx`, `pending` se calcula con `useMemo` que depende solo de `timers.timers`. Con el paso del tiempo no se recalcula: solo cuando cambia el estado (iniciar, pausar, editar). Al enviar, `markSynced` deja el acumulado en cero y reinicia `startedAt` a "ahora". El tiempo transcurrido entre el último recálculo y el envío no se envía ni se conserva.

Reproducción:

| Hora | Acción | Pendiente calculado |
|---|---|---|
| 09:00 | Iniciar tarea A | nada |
| 11:00 | Iniciar tarea B | A = 120 min |
| 13:00 | Enviar | A = 120 min (real: 240) |

Se envían 120 minutos y A queda con 1 minuto tras el envío, cuando el trabajo real fue de 241. Se pierden dos horas sin aviso. Pausar antes de enviar evita el problema.

Corrección propuesta: calcular las horas pendientes en el momento del envío a partir del estado vivo, y en `markSynced` restar los segundos realmente enviados en lugar de reiniciar el temporizador.

### 1.2 Un rechazo de todo el lote borra las entradas válidas

Antes de guardar nada, la API valida que cada entrada apunte a una tarea y un proyecto existentes de la empresa. Si una sola falla (por ejemplo, una tarea borrada o movida de proyecto mientras tenía horas pendientes), rechaza el lote entero sin guardar nada. Responde HTTP 200, `StatusCode` 400 y un `Errors[]` que solo contiene las entradas inválidas.

`useSync.ts` trata como enviadas todas las entradas que no aparecen en `Errors[]` y las limpia en local. Las horas de las demás tareas del envío se pierden.

Corrección propuesta: con `StatusCode >= 400`, releer las horas del servidor y marcar como enviadas solo las entradas cuyo valor coincida con el enviado. Es el mismo mecanismo que sirve para los reintentos de §2.

### Tests necesarios

Antes de corregir, escribir tests que fallen para ambos escenarios (ver la sección de TDD en los estándares). Hace falta añadir un runner (Vitest encaja con Vite) y tests de `useTimers` y `useSync` con el puente `window.itm` simulado.

## 2. Otros problemas de corrección

- **Token caducado:** la API responde 400 ("Token expired"), pero `getTimesheet` y `submitTimeEntries` solo reintentan el login con 401. Hoy funciona de rebote porque la lectura del idioma al arrancar sí trata el 400.
- **Comentarios:** la nota enviada reemplaza el comentario del día para esa tarea. Un segundo envío el mismo día con otra nota borra la primera.
- **Envíos con resultado incierto:** si un envío caduca por tiempo de espera después de que el servidor lo guardó, las horas siguen pendientes y el siguiente envío las suma otra vez. Como la API reemplaza el valor del día, releer antes de reintentar lo resuelve.
- **Redondeo:** cada envío redondea al minuto y descarta el resto (hasta 30 s por envío).
- **Medianoche:** un temporizador que cruza la medianoche imputa todo al día en que empezó.
- **Tope de 24 h:** el servidor limita el día a 24:00 sin avisar; la app no lo valida.

## 3. Seguridad y distribución

- Electron 33.4.11 está fuera de soporte (la versión actual es la 44). Hay que actualizar Electron y electron-builder.
- El actualizador descarga instaladores sin firmar desde una cuenta personal de GitHub. Quien controle esa cuenta o el workflow de release puede instalar código en todos los equipos, y cada uno guarda la API Key del usuario. Hay que firmar los instaladores y acordar quién es dueño del canal de publicación.
- El placeholder del campo API Key en `SettingsScreen.tsx` tiene formato de clave real. Conviene sustituirlo por un valor claramente ficticio.
- `store.ts` guarda en base64 sin cifrar si `safeStorage` no está disponible, sin avisar. Es aceptable en Windows y macOS, pero debería quedar registrado o avisarse.

Lo que ya está bien: `contextIsolation`, `sandbox`, sin `nodeIntegration`, CSP estricta, navegación bloqueada, enlaces externos en lista blanca, llamadas a la API solo desde el proceso principal y API Key cifrada en disco.

## 4. Estándares y documentación

- Añadir tests unitarios, lint y un script `npm test`, y ejecutarlos en CI en cada PR.
- Añadir `AGENTS.md` con las reglas para agentes de este repositorio (ver estándares).
- README: quitar "ya instalado en este equipo" y el historial de versiones, e indicar que la integración usa la API v1 de ITM Platform (`/login`, `/timehours`) y la v2 (`/users`).
- `INSTRUCCIONES-MAC.md` está desactualizado: habla de "ASADev Timesheet" y de distribuir un zip, cuando el `.dmg` ya se genera en CI.

## 5. Orden de trabajo propuesto

1. Tests que reproduzcan §1.1 y §1.2, y sus correcciones.
2. Reintento de login con 400 y lectura del servidor antes de reintentar envíos (§2).
3. Actualizar Electron y firmar los instaladores (§3).
4. `AGENTS.md`, scripts de test y lint, CI y limpieza de la documentación (§4).
