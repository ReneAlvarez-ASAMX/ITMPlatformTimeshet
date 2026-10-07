# ITM Platform Timesheet — Guía de usuario

Aplicación de escritorio para registrar el tiempo que dedicas a tus tareas de **ITM Platform**. Cronometras mientras trabajas (o añades el tiempo a mano) y, cuando quieras, envías las horas a ITM Platform con un clic.

Versión de esta guía: 1.1.3 · Desarrollado por [Actual Solutions](https://actualsolutions.tech/timesheet-itm-platform.html)

## Contenido

1. [Antes de empezar](#1-antes-de-empezar)
2. [Instalación](#2-instalación)
3. [Primer inicio de sesión](#3-primer-inicio-de-sesión)
4. [Conoce la pantalla principal](#4-conoce-la-pantalla-principal)
5. [Registrar tiempo con el temporizador](#5-registrar-tiempo-con-el-temporizador)
6. [Añadir o corregir tiempo a mano](#6-añadir-o-corregir-tiempo-a-mano)
7. [Enviar las horas a ITM Platform](#7-enviar-las-horas-a-itm-platform)
8. [Encontrar tus tareas: búsqueda, filtros y destacadas](#8-encontrar-tus-tareas-búsqueda-filtros-y-destacadas)
9. [El indicador de horas del día](#9-el-indicador-de-horas-del-día)
10. [Recordatorios](#10-recordatorios)
11. [Modo mini y bandeja del sistema](#11-modo-mini-y-bandeja-del-sistema)
12. [Inicio automático con el sistema](#12-inicio-automático-con-el-sistema)
13. [Actualizaciones de la aplicación](#13-actualizaciones-de-la-aplicación)
14. [Cambiar de cuenta y privacidad](#14-cambiar-de-cuenta-y-privacidad)
15. [Preguntas frecuentes y solución de problemas](#15-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Antes de empezar

Necesitas dos datos de tu cuenta de ITM Platform:

| Dato | Qué es | Dónde encontrarlo |
|---|---|---|
| **Empresa (company URL)** | El identificador de tu empresa en ITM Platform. Es el mismo que usas para acceder. | Pídelo a tu administrador si no lo conoces. |
| **API Key** | Una clave personal que permite a la aplicación actuar en tu nombre. | En tu **perfil** de ITM Platform. No la compartas con nadie. |

La aplicación solo muestra las tareas que **tienes asignadas** en ITM Platform. Si una tarea no aparece, revisa que esté asignada a ti.

---

## 2. Instalación

### Windows

1. Ejecuta el instalador **`ITM Platform Timesheet Setup X.X.X.exe`**.
2. Si Windows muestra el aviso *"Windows protegió su PC"*, pulsa **Más información** y después **Ejecutar de todas formas**. Aparece porque el instalador aún no está firmado digitalmente.
3. Elige la carpeta de instalación (o deja la que propone) y continúa. Se crea un acceso directo en el escritorio.
4. Abre **ITM Platform Timesheet** desde el acceso directo o el menú Inicio.

### macOS

Sigue las instrucciones del archivo [`INSTRUCCIONES-MAC.md`](INSTRUCCIONES-MAC.md).

---

## 3. Primer inicio de sesión

Al abrir la aplicación por primera vez verás la pantalla **Conectar con ITM Platform**:

1. Escribe tu **Empresa (company URL)**.
2. Pega tu **API Key**.
3. Pulsa **Conectar**.

Si los datos son correctos, entrarás directamente a tus tareas. Si no, la aplicación mostrará el motivo (por ejemplo, que la API Key no es válida). Corrige el dato y vuelve a intentarlo.

A partir de ahora la aplicación **recuerda tu sesión**: no tendrás que volver a introducir los datos cada vez que la abras.

### Idioma

La aplicación se muestra en el **mismo idioma que tienes configurado en ITM Platform** (*Mi perfil*): español, inglés o portugués. Se lee al iniciar sesión, al abrir la aplicación y cada vez que pulsas **Actualizar tareas**, así que si cambias el idioma en ITM Platform solo tienes que actualizar para ver el cambio. Esta guía está escrita en español; los nombres de los botones y mensajes cambian según tu idioma.

Si la aplicación no puede consultar tu perfil (por ejemplo, sin conexión), usa el último idioma que conocía o, la primera vez, el idioma de tu sistema.

---

## 4. Conoce la pantalla principal

De arriba abajo:

**Cabecera (azul)**
- **Buscador**: filtra tareas y proyectos por nombre.
- **Recordatorios** 🔔: configura los avisos (ver [sección 10](#10-recordatorios)).
- **Inicio automático** ⏻: arrancar la app al encender el equipo (ver [sección 12](#12-inicio-automático-con-el-sistema)).
- **Versión** (`v1.1.0`): estado de las actualizaciones (ver [sección 13](#13-actualizaciones-de-la-aplicación)).
- **Modo mini** ⇲ y **Cambiar cuenta** ⇥: los dos últimos iconos. Pasa el ratón por encima para ver su nombre.

**Barra de día**
- **Selector de semana** (`‹  ›`, **Hoy**): cambia de semana. *Hoy* vuelve a la semana actual.
- **Días de la semana**: el día seleccionado aparece en azul oscuro y el de hoy lleva un borde naranja.
- **Indicador de horas del día**: barra y porcentaje respecto a la jornada (ver [sección 9](#9-el-indicador-de-horas-del-día)).
- **Actualizar tareas**: vuelve a cargar tus tareas y las horas ya reportadas desde ITM Platform.

**Lista de tareas**, agrupada por proyecto. La cabecera de cada proyecto indica **qué abarca cada cifra**:

> `Hoy: 1h 39m · Semana: 2h 24m · Sin enviar: 2h`

- **Hoy** (o la fecha del día seleccionado): lo reportado en ITM Platform ese día en el proyecto.
- **Semana**: lo reportado en toda la semana que estás viendo.
- **Sin enviar**: el tiempo pendiente de enviar del proyecto, **de cualquier fecha** (puede incluir días de otras semanas).

Pulsa el nombre del proyecto para plegarlo o desplegarlo.

**Barra inferior**: dos líneas y el botón **Revisar y enviar**.

> `Semana 05 oct – 11 oct: 2h 43m en ITM + 2h 24m sin enviar = 5h 7m de 40h (13%)`
> `3 tareas con 4h 24m sin enviar — 01 oct: 2h · 05 oct: 15m · Hoy: 2h 9m`

- La primera línea es el **resumen de la semana**: lo ya reportado en ITM, más lo pendiente cuya fecha cae en esa semana, frente a las 40 horas de la semana (8 h de lunes a viernes).
- La segunda es **todo** lo pendiente de enviar, **desglosado por la fecha a la que corresponde** cada parte, aunque sea de otra semana.

**Pie**: *Desarrollado por Actual Solutions*, con enlace a la página de la herramienta.

### Cómo se lee una tarea

Cada tarea muestra:
- ⭐ **Estrella**: marcarla como destacada.
- **Nombre** de la tarea.
- **Reportadas**: *"Hoy: 2h 30m reportadas"* es lo que ya está registrado en ITM Platform para el día seleccionado.
- **Sin enviar con su fecha**: si hay tiempo pendiente, se añade *"· 57m sin enviar (Hoy)"*. Lo que va entre paréntesis es **el día al que pertenece ese tiempo**, por ejemplo *"· 2h sin enviar (01 oct)"*.
- **Reloj** a la derecha y botón **Iniciar / Pausar**.
- Una **barra naranja** a la izquierda y fondo cálido indican que su temporizador está **en marcha**.

---

## 5. Registrar tiempo con el temporizador

### Iniciar y pausar

1. Selecciona el día **de hoy** (los temporizadores solo se pueden iniciar en el día actual).
2. En la tarea en la que vas a trabajar, pulsa **▶ Iniciar**. El reloj empieza a contar.
3. Cuando termines o te interrumpas, pulsa **⏸ Pausar**. El tiempo queda guardado como **sin enviar**.

Puedes tener **varios temporizadores en marcha a la vez**, uno por tarea.

Si el botón *Iniciar* aparece desactivado y la tarea indica *"no admite registro de horas este día"*, ITM Platform no permite imputar tiempo a esa tarea ese día.

### Si olvidaste iniciar a tiempo

Con el temporizador en marcha verás **"Iniciado a las HH:MM · ajustar"**. Púlsalo, indica la hora real en la que empezaste y confirma con **OK**. El reloj se recalcula.

> La hora de inicio no puede ser posterior al momento actual.

### Añadir una nota

En cuanto una tarea acumula tiempo aparece un campo **Nota (opcional)**. Lo que escribas se enviará a ITM Platform como comentario de esas horas.

### No pierdes el tiempo si algo falla

El progreso se **guarda automáticamente** en tu equipo. Si la aplicación o el equipo se cierran de forma inesperada, al volver a abrir verás tus temporizadores tal como estaban.

### Una tarea con tiempo de otro día

Una tarea solo puede acumular tiempo pendiente de **un día** a la vez. Si tiene tiempo **sin enviar de otra fecha**, no podrás iniciarla ni añadirle tiempo manual para otro día hasta que lo envíes. Esto afecta **solo a esa tarea**: el resto de tus tareas funcionan con normalidad.

La propia tarea te lo avisa de antemano con una nota naranja, con el tiempo y la fecha exactos y un enlace **Revisar y enviar**:

> *Tiene 2h sin enviar del 01 oct. Para registrar tiempo de otro día en esta tarea, primero envía esas horas.*

Si pulsas **Iniciar** igualmente, la nota se pone en rojo y el temporizador no arranca. Envía esas horas (ver [Enviar las horas](#7-enviar-las-horas-a-itm-platform)) y la tarea quedará libre.

---

## 6. Añadir o corregir tiempo a mano

### Añadir tiempo sin usar el temporizador

1. Selecciona el **día** al que quieres imputar el tiempo (puede ser hoy o un día anterior de la semana).
2. En la tarea, pulsa **+ Añadir tiempo manual**.
3. Escribe la duración en formato **h:mm** (por ejemplo `1:30` para una hora y media) y pulsa **Añadir**.

El tiempo se suma al pendiente de esa tarea y día.

### Corregir el tiempo pendiente

Si una tarea está **en pausa** y tiene tiempo sin enviar, aparece el enlace **✎ Editar** junto al reloj. Escribe la cantidad correcta en formato `h:mm` y pulsa **OK**. Esto **reemplaza** la cantidad pendiente (no la suma).

> Solo se corrige el tiempo **pendiente de enviar**. Las horas que ya están en ITM Platform no se modifican desde la aplicación.

---

## 7. Enviar las horas a ITM Platform

El tiempo que cronometras o añades queda **solo en tu equipo** hasta que lo envías.

1. Pulsa **Revisar y enviar** (barra inferior). Se abre el panel **Revisar antes de enviar**.
2. Para cada tarea verás:
   - el día,
   - **Ya reportado**: lo que ITM Platform ya tiene,
   - **Pendiente**: lo que vas a añadir (editable si el temporizador está en pausa),
   - una **nota** opcional,
   - **Total a enviar**: *ya reportado + pendiente*.
   - **Fecha**: cada línea indica el día al que se registrarán las horas. Si no es hoy, aparece un **aviso naranja** (*"Estas horas se registrarán el 05 oct, no hoy"*). **Compruébalo siempre antes de confirmar**: ITM Platform guardará las horas en esa fecha.
3. Revisa y ajusta lo que necesites.
4. Pulsa **Confirmar y enviar**.

Después del envío, el tiempo pendiente se pone a cero, la lista se actualiza con las horas reportadas y el indicador del día se recalcula.

Detalles importantes:
- **No se duplican horas.** ITM Platform reemplaza el total del día; por eso la aplicación consulta lo ya reportado y le **suma** tu tiempo antes de enviarlo.
- Las tareas con **menos de 30 segundos** pendientes no se envían.
- Los temporizadores **en marcha siguen corriendo** tras el envío: solo se envía el tiempo acumulado hasta ese momento.
- Si alguna tarea falla (por ejemplo, el día está cerrado o la tarea ya no admite horas), se muestra el motivo junto a ella. Las demás se envían con normalidad y la que falló conserva su tiempo para que puedas corregirla o reintentarlo.

---

## 8. Encontrar tus tareas: búsqueda, filtros y destacadas

### Búsqueda

Escribe en el buscador de la cabecera. Se buscan coincidencias en el nombre de la **tarea** o del **proyecto**, sin distinguir mayúsculas ni tildes. Mientras buscas, los proyectos se muestran desplegados.

### Plegar y desplegar proyectos

Usa **Expandir todo** y **Colapsar todo** sobre la lista, o pulsa el nombre de un proyecto.

### Filtros de la lista

| Filtro | Qué muestra |
|---|---|
| **Todas las tareas** | Todas tus tareas de la semana. |
| **Destacadas** ⭐ | Solo las que marcaste con estrella. |
| **Con temporizador activo** 🕒 | Solo las que tienen el temporizador en marcha. |

### Tareas destacadas

Pulsa la **estrella** junto al nombre de una tarea para marcarla o desmarcarla. Es ideal para centrarte en las pocas tareas que realmente estás trabajando.

### Selección diaria de destacadas

Como las prioridades cambian cada día, **al iniciar la aplicación** te pregunta *"¿Quieres reestablecer tu lista de tareas destacadas?"*:

- **No, mantener la lista**: todo sigue como estaba.
- **Sí, reestablecer**: verás tus tareas agrupadas por proyecto, **solo con la estrella**. Marca las de hoy y pulsa **Guardar destacadas**. La lista anterior se reemplaza por la nueva.
  - **Cancelar** en esta pantalla conserva la lista anterior.

La pregunta solo aparece **una vez cada vez que abres la aplicación**.

---

## 9. El indicador de horas del día

Junto al día seleccionado hay una **barra de progreso** que compara tu día con una jornada de **8 horas** (de lunes a viernes):

- 🟦 **En ITM**: horas ya reportadas en ITM Platform ese día.
- 🟧 **Sin enviar**: horas de tus temporizadores (o manuales) que aún no has enviado.
- **Porcentaje**: la suma de ambas frente a las 8 horas.

Ejemplo: 4 h 30 m en ITM + 1 h 22 m sin enviar = 5 h 52 m → **73 %**.

Cómo interpretarlo:
- Si **superas el 100 %** el porcentaje se pone en **verde** y la barra se reparte entre las dos partes.
- En **sábado y domingo** no hay jornada: se muestra **"Día no laborable"** y el porcentaje aparece como "—". Si trabajas ese día, sus horas se muestran igualmente.
- El indicador sigue al **día que selecciones**. Mientras un temporizador corre, se actualiza cada segundo.
- **Otros días**: si tienes tiempo sin enviar de **otras fechas**, aparece un cuarto elemento (por ejemplo *"Otros días 2h 15m"*). **No cuenta en el porcentaje** de este día, pero sí en el total de la barra inferior. Púlsalo para abrir la revisión y ver cada parte con su fecha.
- La jornada es fija (8 horas); no tiene en cuenta festivos ni vacaciones.

---

## 10. Recordatorios

Pulsa **Recordatorios** en la cabecera para configurar dos avisos. Aparecen como notificación de escritorio con un pitido breve. Pulsar la notificación abre la aplicación.

| Aviso | Cuándo salta | Por defecto |
|---|---|---|
| **Sin temporizador activo** | Si no hay ningún temporizador en marcha, para que no olvides cronometrar. | Cada **5 minutos** |
| **¿Sigues trabajando?** | Mientras hay un temporizador en marcha, para comprobar que sigues en esa tarea. Indica la tarea y el proyecto; si hay varios, los agrupa en un solo aviso. | Cada **15 minutos** |

Para cambiarlos:
1. Marca o desmarca cada aviso.
2. Indica los **minutos** de cada uno (mínimo 1).
3. Pulsa **Guardar**.

Notas:
- El aviso de "¿sigues trabajando?" cuenta desde que arranca cada temporizador. Si cambias el intervalo, la cuenta empieza de nuevo.
- Para recibir las notificaciones, la aplicación debe estar **abierta** (aunque sea en la bandeja del sistema).
- En Windows, el modo *No molestar* o *Asistente de concentración* puede silenciar los avisos.

---

## 11. Modo mini y bandeja del sistema

### Modo mini

Pulsa el icono **Modo mini** (cabecera) para reducir la aplicación a una **ventana pequeña** en la esquina inferior derecha de la pantalla. Se mantiene **siempre por encima** del resto de ventanas y muestra tus temporizadores activos con su reloj.

- **Detener**: pausa ese temporizador desde la propia ventana.
- **Vista normal**: vuelve a la pantalla completa.

### Bandeja del sistema

- Al **cerrar la ventana** con la **X**, la aplicación **no se cierra**: se oculta en la bandeja (junto al reloj de Windows) para que tus temporizadores sigan funcionando.
- El **icono de la bandeja** muestra al pasar el ratón cuántos temporizadores hay en curso y el tiempo de hoy.
- **Doble clic** en el icono: abre la ventana. **Clic derecho**: menú con **Mostrar** y **Salir**.
- Para **cerrar del todo** la aplicación usa **Salir** en ese menú.
- Si no ves el icono, pulsa la flecha **^** de la barra de tareas: Windows puede agruparlo con los iconos ocultos.

Solo puede haber **una copia** de la aplicación abierta a la vez: si la abres de nuevo, se trae al frente la que ya está en marcha.

---

## 12. Inicio automático con el sistema

Pulsa **Inicio automático** (icono ⏻ de la cabecera) y marca **Iniciar la aplicación al iniciar sesión en el sistema**.

- La aplicación arrancará sola al encender el equipo y se quedará **en la bandeja**, sin abrir la ventana, hasta que la abras.
- El icono se vuelve **naranja** cuando está activado.
- Solo está disponible en la **aplicación instalada**.

Para desactivarlo, desmarca la misma casilla.

---

## 13. Actualizaciones de la aplicación

La aplicación comprueba si hay una **versión nueva** al arrancar y después cada pocas horas. *(Solo en Windows.)*

Cuando hay una disponible:
1. Recibes una **notificación** y el botón de versión de la cabecera cambia a **⬆ Actualizar a vX.X.X**.
2. Pulsa el botón y después **Descargar**. Verás el progreso.
3. Cuando termine la descarga, pulsa **Reiniciar e instalar**. La aplicación se cierra, se actualiza y se vuelve a abrir.

Puedes comprobarlo cuando quieras: pulsa el botón de versión → **Buscar actualizaciones**.

Tú decides cuándo actualizar: nada se instala sin tu confirmación.

---

## 14. Cambiar de cuenta y privacidad

### Cambiar de cuenta

Pulsa el icono **Cambiar cuenta** (el último de la cabecera). La aplicación cierra tu sesión y **borra las credenciales guardadas**; volverás a la pantalla de conexión para entrar con otra empresa o API Key.

### Dónde se guardan tus datos

- Tu **API Key y la sesión** se guardan **cifradas** en tu equipo usando el almacén de credenciales del sistema (Windows o Llavero de macOS).
- Tus **temporizadores, tiempo pendiente, notas y tareas destacadas** se guardan **localmente** en tu equipo. No se comparten con otros usuarios.
- La aplicación solo se comunica con **ITM Platform** (para leer tus tareas y enviar tus horas) y, para las actualizaciones, con GitHub.

---

## 15. Preguntas frecuentes y solución de problemas

**No puedo conectar: "Verifica el company y la API Key".**
Comprueba que el identificador de la empresa esté bien escrito (sin espacios) y que la API Key sea la de tu perfil y esté completa. Si la cambiaste en ITM Platform, usa la nueva.

**No veo una tarea.**
Solo aparecen las tareas asignadas a ti dentro de la semana que estás viendo. Comprueba la asignación en ITM Platform y pulsa **Actualizar tareas**. Revisa también que no tengas activo el filtro *Destacadas* o *Con temporizador activo*, ni texto en el buscador.

**No puedo pulsar "Iniciar".**
Los temporizadores solo se inician en el **día de hoy**; si estás viendo otro día, usa **Añadir tiempo manual**. También puede ser que la tarea no admita horas ese día.

**Una tarea muestra "Tiene X sin enviar del …" y no me deja iniciarla.**
La tarea tiene tiempo pendiente de una fecha anterior. Envíalo con **Revisar y enviar** y después podrás volver a usarla.

**Mis horas no cuadran con ITM Platform.**
Pulsa **Actualizar tareas** para recargar lo reportado. Recuerda que el tiempo **sin enviar** solo existe en tu equipo hasta que lo envíes.

**Al enviar, una tarea muestra un error.**
Lee el mensaje junto a la tarea (suele indicar que el día está cerrado o que no admite horas). El resto de tareas sí se envían; la que falló conserva su tiempo.

**He cerrado la ventana y los avisos siguen saliendo.**
Es lo esperado: la aplicación sigue activa en la bandeja. Para cerrarla del todo, clic derecho en su icono → **Salir**.

**No me llegan las notificaciones.**
Verifica que la aplicación esté abierta (o en la bandeja), que los avisos estén activados en **Recordatorios** y que Windows no esté en *No molestar*.

**La aplicación no arranca al encender el equipo.**
Activa **Inicio automático** desde la cabecera. Solo funciona en la aplicación **instalada**, no en la versión de desarrollo.

**¿Se pierde el tiempo si se apaga el equipo de golpe?**
No, el progreso se guarda con frecuencia. Al volver a abrir la aplicación recuperarás tus temporizadores; si uno estaba en marcha, seguirá contando el tiempo transcurrido desde que lo iniciaste.

**¿Puedo usar la aplicación sin conexión?**
Necesitas conexión para entrar, cargar tus tareas y enviar horas. Si la pierdes con la aplicación ya abierta, los temporizadores siguen contando en tu equipo y puedes enviar las horas cuando la recuperes.

---

*¿Necesitas ayuda o quieres proponer una mejora? Visita la [página de la herramienta](https://actualsolutions.tech/timesheet-itm-platform.html) o contacta con Actual Solutions.*
