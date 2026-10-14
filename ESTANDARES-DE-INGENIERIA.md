# Estándares de ingeniería

Este documento resume cómo trabajamos en ITM Platform y por qué. Está pensado para que lo lea una persona y también para dárselo a un asistente de IA (Claude, Codex, Copilot…) como punto de partida. Los detalles de cada regla los puede desarrollar el propio asistente a partir de aquí.

La idea general es sencilla: cada cambio debe poder comprobarse sin depender de la memoria de quien lo hizo. Los tests demuestran que el código funciona, la documentación explica cómo está hecho hoy y el historial de Git explica cómo se llegó hasta ahí.

## Tests

### Por qué

Una app de registro de horas maneja datos que el usuario no puede reconstruir. Si se pierde una hora, nadie lo nota hasta que el informe no cuadra. Los tests automáticos son la única forma práctica de comprobar, en cada cambio, que el tiempo registrado llega entero a ITM Platform.

También permiten que un asistente de IA trabaje con seguridad: puede cambiar código, ejecutar los tests y saber si ha roto algo, sin que una persona tenga que probarlo todo a mano.

### TDD para la lógica principal

Para la lógica que importa (cálculo de tiempos, sincronización, reintentos) escribimos primero un test que falla y que describe el comportamiento esperado, y después el código que lo hace pasar.

Ventajas:

- El test demuestra el fallo antes de corregirlo, así que se sabe que el test sirve.
- Obliga a pensar en el comportamiento antes que en la implementación.
- El fallo no puede volver sin que un test lo detecte.

Los casos límite pueden añadirse después de implementar.

### Tipos de test

- **Unitarios:** prueban funciones y hooks aislados, con las dependencias externas simuladas (por ejemplo, `window.itm`). Son rápidos y deben cubrir la lógica de negocio. En este proyecto, Vitest encaja de forma natural con Vite.
- **Integración:** prueban la comunicación real con la API en un entorno que no sea producción (por ejemplo, el entorno demo). Deben borrar todo lo que crean.
- **End-to-end (E2E):** prueban la app como la usa el usuario: abrir, iniciar un temporizador, enviar horas. Detectan fallos que los unitarios no ven, como un botón que llama a la función equivocada. Para Electron se suele usar Playwright.

No hace falta cubrirlo todo con E2E. La mayoría de los tests deben ser unitarios, unos pocos de integración y E2E solo para los recorridos críticos.

## Comprobaciones antes de entregar

Antes de dar un cambio por terminado se ejecutan los tests, el lint, la comprobación de tipos y el build. Si algo ya fallaba antes del cambio, se indica aparte.

Los cambios visibles se prueban en la app, no solo en los tests. Cuando un cambio escribe en un sistema externo (por ejemplo, enviar horas), se verifica leyendo de nuevo el resultado.

Lo ideal es que CI ejecute estas comprobaciones en cada pull request, para que no dependan de que alguien se acuerde.

## Cambios pequeños y basados en lo existente

- Antes de añadir código, se busca si ya existe algo parecido y se sigue el mismo patrón.
- Se prefiere el cambio más pequeño que resuelva el problema.
- Cada PR trata un solo tema, y los mensajes de commit dicen qué cambia en pocas palabras.

## Documentación

Cada documento tiene un propósito y un lugar:

- `README.md`: cómo es la app hoy, cómo instalarla y usarla, y con qué sistemas se integra. Debe nombrar los endpoints de ITM Platform que usa la app.
- `AGENTS.md`: instrucciones para asistentes de IA que cambian cómo deben trabajar en este repositorio (comandos, reglas, límites). Si el asistente es Claude, un `CLAUDE.md` que solo contenga `@AGENTS.md` evita duplicar.
- `zz_Specifications/`: especificaciones de funcionalidades planificadas.
- `zz_Tickets/`: incidencias, investigaciones y fallos, con nombre `AAAA-MM-DD-tema.md`.
- Cuando un ticket o especificación se termina, se mueve a `done/` con su estado final y cómo se verificó. Si se descarta, va a `rejected/`.

Reglas de redacción:

- Documentación breve y escrita en presente: describe cómo funciona la app ahora. El historial ya está en Git.
- Un párrafo o elemento de lista por línea en Markdown; el editor se encarga de ajustarlo.
- Nunca se ponen claves, tokens ni contraseñas en documentos, código ni logs.

## Seguridad y dependencias

- Las credenciales se guardan cifradas con el almacén del sistema operativo, como ya hace la app.
- Las dependencias se mantienen en versiones con soporte. Electron publica parches de seguridad con frecuencia y solo mantiene las tres últimas versiones principales.
- Los instaladores que se actualizan solos deben ir firmados, para que el sistema compruebe quién los publica.

## Cómo empezar

Sugerencia para la primera sesión con tu asistente de IA:

1. Darle este documento y el ticket [zz_Tickets/2026-10-06-evaluacion-inicial-y-perdida-de-horas.md](zz_Tickets/2026-10-06-evaluacion-inicial-y-perdida-de-horas.md).
2. Pedirle que cree `AGENTS.md` con las reglas de este repositorio que se derivan de aquí, y que añada Vitest y un script `npm test`.
3. Trabajar el ticket en el orden que propone, empezando por los tests que reproducen la pérdida de horas.
