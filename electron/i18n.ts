// Textos de la app en los tres idiomas de ITM Platform (español, inglés y portugués).
// Se comparte entre el proceso principal (notificaciones, bandeja, errores) y la interfaz.

export type Language = "es" | "en" | "pt";

export const DEFAULT_LANGUAGE: Language = "es";

const LOCALES: Record<Language, string> = { es: "es-ES", en: "en-US", pt: "pt-BR" };

export function localeFor(language: Language): string {
  return LOCALES[language];
}

/**
 * Interpreta el idioma tal y como lo devuelve ITM Platform en el perfil del usuario
 * ("Spanish", "English", "Portuguese"…) o un código de idioma del sistema ("es-ES", "pt-BR"…).
 * Devuelve null si no es ninguno de los tres idiomas soportados.
 */
export function parseLanguage(value: unknown): Language | null {
  if (typeof value !== "string") return null;
  const v = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (v.startsWith("es") || v.startsWith("spanish")) return "es";
  if (v.startsWith("en") || v.startsWith("ingl")) return "en";
  if (v.startsWith("pt") || v.startsWith("portug")) return "pt";
  return null;
}

const es = {
  // Comunes
  "common.ok": "OK",
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "common.save": "Guardar",
  "common.retry": "Reintentar",
  "app.loading": "Cargando…",
  "app.poweredBy": "Desarrollado por Actual Solutions",

  // Pantalla de conexión
  "settings.title": "Conectar con ITM Platform",
  "settings.hint":
    "Introduce el identificador de tu empresa (el que usas para acceder a ITM Platform) y tu API Key personal, disponible en tu perfil de ITM Platform.",
  "settings.demoHint":
    "Entorno de demostración {company}. Introduce la API Key de tu usuario en este entorno.",
  "settings.company": "Empresa (company URL)",
  "settings.companyPlaceholder": "miempresa",
  "settings.apiKey": "API Key",
  "settings.connect": "Conectar",
  "settings.connecting": "Conectando…",
  "settings.connectError": "No se pudo conectar con ITM Platform.",

  // Cabecera y barra de día
  "header.search": "Buscar tarea o proyecto…",
  "header.miniMode": "Modo mini",
  "header.switchAccount": "Cambiar cuenta",
  "header.today": "Hoy",
  "header.refresh": "Actualizar tareas",
  "header.refreshing": "Actualizando…",
  "week.previous": "Semana anterior",
  "week.next": "Semana siguiente",
  "week.summary":
    "Semana {range}: {reported} en ITM + {pending} sin enviar = {total} de {target} ({percent}%)",

  // Lista de tareas
  "list.loading": "Cargando tareas…",
  "list.loadError": "No se pudo cargar el timesheet.",
  "list.expandAll": "Expandir todo",
  "list.collapseAll": "Colapsar todo",
  "list.empty": "No se encontraron tareas para este periodo.",
  "list.projectDay": "{day}: {time}",
  "list.projectWeek": "Semana: {time}",
  "list.projectUnsent": "Sin enviar: {time}",
  "filter.all": "Todas las tareas",
  "filter.favorites": "Destacadas",
  "filter.active": "Con temporizador activo",

  // Tarea
  "task.favorite.add": "Marcar como destacada",
  "task.favorite.remove": "Quitar de destacadas",
  "task.reported": "{day}: {time} reportadas",
  "task.unsentOn": " · {time} sin enviar ({date})",
  "task.otherDayNote":
    "Tiene {time} sin enviar del {date}. Para registrar tiempo de otro día en esta tarea, primero envía esas horas.",
  "task.noTimeAllowed": "Esta tarea no admite registro de horas este día.",
  "task.startLabel": "Inicio:",
  "task.startedAt": "Iniciado a las {time} · ajustar",
  "task.notePlaceholder": "Nota (opcional)",
  "task.manualPlaceholder": "h:mm",
  "task.manualAdd": "Añadir",
  "task.manualToggle": "Añadir tiempo manual",
  "task.edit": "Editar",
  "task.start": "Iniciar",
  "task.pause": "Pausar",
  "task.error.amount": "No se pudo corregir el tiempo.",
  "task.error.start": "No se pudo ajustar la hora de inicio.",
  "task.error.generic": "No se pudo registrar el tiempo.",

  // Envío de horas
  "sync.pendingOne": "{count} tarea con {time} sin enviar",
  "sync.pendingMany": "{count} tareas con {time} sin enviar",
  "sync.allSynced": "Todo sincronizado",
  "sync.itemErrors": "Algunas tareas no se pudieron enviar: {errors}",
  "sync.review": "Revisar y enviar",
  "sync.pendingDetail": "{summary} — {breakdown}",
  "sync.error.send": "No se pudieron enviar las horas.",
  "sync.error.generic": "Error al enviar las horas a ITM Platform.",
  "review.title": "Revisar antes de enviar",
  "review.loading": "Consultando lo ya reportado en ITM Platform…",
  "review.loadError": "No se pudo consultar lo ya reportado en ITM Platform.",
  "review.empty": "No queda tiempo pendiente por enviar.",
  "review.confirm": "Confirmar y enviar ({count})",
  "review.sending": "Enviando…",
  "review.alreadyReported": "Ya reportado: {time}",
  "review.pending": "Pendiente",
  "review.running": "{time} (en marcha)",
  "review.otherDate": "Estas horas se registrarán el {date}, no hoy.",
  "review.total": "Total a enviar: {time}",

  // Destacadas del día
  "fav.title": "Tareas destacadas de hoy",
  "fav.ask":
    "¿Quieres reestablecer tu lista de tareas destacadas? La prioridad puede ser distinta cada día.",
  "fav.noneNow": "Ahora mismo no tienes ninguna tarea destacada.",
  "fav.countOne": "Ahora mismo tienes 1 tarea destacada.",
  "fav.countMany": "Ahora mismo tienes {count} tareas destacadas.",
  "fav.keep": "No, mantener la lista",
  "fav.reset": "Sí, reestablecer",
  "fav.pickTitle": "Marca tus tareas destacadas de hoy",
  "fav.cancelKeep": "Cancelar (mantener la lista anterior)",
  "fav.save": "Guardar destacadas ({count})",

  // Indicador del día
  "day.progressLabel": "Horas del día respecto a la jornada",
  "day.nonWorking": "Día no laborable",
  "day.summary": "{total} de {target}",
  "day.summaryNonWorking": "{total} · día no laborable",
  "day.inItm": "En ITM {time}",
  "day.unsent": "Sin enviar {time}",
  "day.workday": "Jornada {time}",
  "day.otherDays": "Otros días {time}",
  "day.otherDaysHint":
    "Tiempo sin enviar de otras fechas. No cuenta en el porcentaje de este día, pero sí en el total de la barra inferior. Púlsalo para revisar esas horas.",

  // Recordatorios
  "reminders.title": "Recordatorios",
  "reminders.disabled": "Desactivados",
  "reminders.noTimer": "Recordarme si no hay ningún temporizador activo",
  "reminders.every": "Cada",
  "reminders.minutes": "minutos",
  "reminders.stillWorking":
    "Preguntarme si sigo trabajando mientras haya un temporizador activo",
  "reminder.noTimerTitle": "Recordatorio de timesheet",
  "reminder.noTimerBody": "No tienes ningún temporizador activo. ¿En qué estás trabajando ahora?",
  "reminder.activeTitle": "Temporizador activo",
  "reminder.activeOne": "Sigue en marcha: {task}. ¿Continúas trabajando en esta tarea?",
  "reminder.activeMany":
    "Siguen en marcha {count} temporizadores: {tasks}. ¿Continúas trabajando en ellas?",

  // Inicio automático
  "autoLaunch.title": "Inicio automático",
  "autoLaunch.checkbox": "Iniciar la aplicación al iniciar sesión en el sistema",
  "autoLaunch.hintOn": "Al arrancar con el sistema, la app queda en la bandeja hasta que la abras.",
  "autoLaunch.hintUnsupported": "Solo disponible en la aplicación instalada, no en modo desarrollo.",

  // Actualizaciones
  "update.available": "Actualizar a v{version}",
  "update.downloading": "Descargando… {percent}%",
  "update.installed": "Versión instalada: v{version}",
  "update.unsupported":
    "Las actualizaciones automáticas solo están disponibles en la app instalada para Windows.",
  "update.checking": "Buscando actualizaciones…",
  "update.newVersion": "Hay una nueva versión: v{version}.",
  "update.download": "Descargar",
  "update.downloadingVersion": "Descargando v{version}… {percent}%",
  "update.ready":
    "La versión v{version} está descargada. La app se cerrará y volverá a abrirse al instalar.",
  "update.install": "Reiniciar e instalar",
  "update.errorFallback": "No se pudo completar la actualización.",
  "update.upToDate": "Estás al día.",
  "update.check": "Buscar actualizaciones",
  "update.notifyTitle": "Nueva versión disponible",
  "update.notifyBody":
    "ITM Platform Timesheet {version} está lista para descargar. Ábrela para actualizar.",
  "update.error.noReleases": "Todavía no hay versiones publicadas en GitHub.",
  "update.error.fetch":
    "No se pudieron consultar las versiones publicadas. Es posible que todavía no haya ninguna disponible.",
  "update.error.network":
    "No hay conexión con GitHub. Comprueba tu conexión a internet e inténtalo de nuevo.",

  // Modo mini y bandeja
  "mini.empty": "No hay temporizadores activos.",
  "mini.stop": "Detener",
  "mini.normalView": "Vista normal",
  "tray.show": "Mostrar",
  "tray.quit": "Salir",
  "tray.status": "{count} en curso · {time} hoy",

  // Errores del proceso principal y de la API
  "error.noSession": "No hay una sesión iniciada.",
  "api.ctx.login": "Login",
  "api.ctx.timesheet": "Obtener timesheet",
  "api.ctx.submit": "Enviar horas",
  "api.ctx.language": "Obtener idioma",
  "api.unexpected": "Respuesta inesperada de ITM Platform ({context}): {detail}",
  "api.noToken":
    "No se recibió un token de sesión válido. Verifica el company y la API Key.",
} as const;

export type MessageKey = keyof typeof es;
type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  "common.ok": "OK",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.save": "Save",
  "common.retry": "Retry",
  "app.loading": "Loading…",
  "app.poweredBy": "Developed by Actual Solutions",

  "settings.title": "Connect to ITM Platform",
  "settings.hint":
    "Enter your company identifier (the one you use to access ITM Platform) and your personal API Key, available in your ITM Platform profile.",
  "settings.demoHint":
    "Demo environment {company}. Enter your user's API Key for this environment.",
  "settings.company": "Company (company URL)",
  "settings.companyPlaceholder": "mycompany",
  "settings.apiKey": "API Key",
  "settings.connect": "Connect",
  "settings.connecting": "Connecting…",
  "settings.connectError": "Could not connect to ITM Platform.",

  "header.search": "Search task or project…",
  "header.miniMode": "Mini mode",
  "header.switchAccount": "Switch account",
  "header.today": "Today",
  "header.refresh": "Refresh tasks",
  "header.refreshing": "Refreshing…",
  "week.previous": "Previous week",
  "week.next": "Next week",
  "week.summary":
    "Week {range}: {reported} in ITM + {pending} unsent = {total} of {target} ({percent}%)",

  "list.loading": "Loading tasks…",
  "list.loadError": "Could not load the timesheet.",
  "list.expandAll": "Expand all",
  "list.collapseAll": "Collapse all",
  "list.empty": "No tasks found for this period.",
  "list.projectDay": "{day}: {time}",
  "list.projectWeek": "Week: {time}",
  "list.projectUnsent": "Unsent: {time}",
  "filter.all": "All tasks",
  "filter.favorites": "Starred",
  "filter.active": "With active timer",

  "task.favorite.add": "Star this task",
  "task.favorite.remove": "Remove from starred",
  "task.reported": "{day}: {time} reported",
  "task.unsentOn": " · {time} unsent ({date})",
  "task.otherDayNote":
    "It has {time} unsent from {date}. To record time on another day for this task, send those hours first.",
  "task.noTimeAllowed": "This task does not allow time entries on this day.",
  "task.startLabel": "Start:",
  "task.startedAt": "Started at {time} · adjust",
  "task.notePlaceholder": "Note (optional)",
  "task.manualPlaceholder": "h:mm",
  "task.manualAdd": "Add",
  "task.manualToggle": "Add time manually",
  "task.edit": "Edit",
  "task.start": "Start",
  "task.pause": "Pause",
  "task.error.amount": "Could not correct the time.",
  "task.error.start": "Could not adjust the start time.",
  "task.error.generic": "Could not record the time.",

  "sync.pendingOne": "{count} task with {time} unsent",
  "sync.pendingMany": "{count} tasks with {time} unsent",
  "sync.allSynced": "Everything synced",
  "sync.itemErrors": "Some tasks could not be sent: {errors}",
  "sync.review": "Review and send",
  "sync.pendingDetail": "{summary} — {breakdown}",
  "sync.error.send": "The hours could not be sent.",
  "sync.error.generic": "Error sending the hours to ITM Platform.",
  "review.title": "Review before sending",
  "review.loading": "Checking what is already reported in ITM Platform…",
  "review.loadError": "Could not check what is already reported in ITM Platform.",
  "review.empty": "There is no pending time to send.",
  "review.confirm": "Confirm and send ({count})",
  "review.sending": "Sending…",
  "review.alreadyReported": "Already reported: {time}",
  "review.pending": "Pending",
  "review.running": "{time} (running)",
  "review.otherDate": "These hours will be recorded on {date}, not today.",
  "review.total": "Total to send: {time}",

  "fav.title": "Today's starred tasks",
  "fav.ask":
    "Do you want to reset your starred tasks list? Priorities can be different every day.",
  "fav.noneNow": "You currently have no starred tasks.",
  "fav.countOne": "You currently have 1 starred task.",
  "fav.countMany": "You currently have {count} starred tasks.",
  "fav.keep": "No, keep the list",
  "fav.reset": "Yes, reset",
  "fav.pickTitle": "Star today's tasks",
  "fav.cancelKeep": "Cancel (keep the previous list)",
  "fav.save": "Save starred ({count})",

  "day.progressLabel": "Hours of the day against the workday",
  "day.nonWorking": "Non-working day",
  "day.summary": "{total} of {target}",
  "day.summaryNonWorking": "{total} · non-working day",
  "day.inItm": "In ITM {time}",
  "day.unsent": "Unsent {time}",
  "day.workday": "Workday {time}",
  "day.otherDays": "Other days {time}",
  "day.otherDaysHint":
    "Unsent time from other dates. It does not count towards this day's percentage, but it is included in the total of the bottom bar. Click to review those hours.",

  "reminders.title": "Reminders",
  "reminders.disabled": "Disabled",
  "reminders.noTimer": "Remind me if there is no active timer",
  "reminders.every": "Every",
  "reminders.minutes": "minutes",
  "reminders.stillWorking": "Ask me if I am still working while a timer is active",
  "reminder.noTimerTitle": "Timesheet reminder",
  "reminder.noTimerBody": "You have no active timer. What are you working on now?",
  "reminder.activeTitle": "Active timer",
  "reminder.activeOne": "Still running: {task}. Are you still working on this task?",
  "reminder.activeMany": "{count} timers are still running: {tasks}. Are you still working on them?",

  "autoLaunch.title": "Start with system",
  "autoLaunch.checkbox": "Start the app when I sign in to the system",
  "autoLaunch.hintOn": "When started with the system, the app stays in the tray until you open it.",
  "autoLaunch.hintUnsupported": "Only available in the installed app, not in development mode.",

  "update.available": "Update to v{version}",
  "update.downloading": "Downloading… {percent}%",
  "update.installed": "Installed version: v{version}",
  "update.unsupported": "Automatic updates are only available in the installed Windows app.",
  "update.checking": "Checking for updates…",
  "update.newVersion": "A new version is available: v{version}.",
  "update.download": "Download",
  "update.downloadingVersion": "Downloading v{version}… {percent}%",
  "update.ready":
    "Version v{version} has been downloaded. The app will close and reopen when installing.",
  "update.install": "Restart and install",
  "update.errorFallback": "The update could not be completed.",
  "update.upToDate": "You are up to date.",
  "update.check": "Check for updates",
  "update.notifyTitle": "New version available",
  "update.notifyBody": "ITM Platform Timesheet {version} is ready to download. Open it to update.",
  "update.error.noReleases": "There are no published versions on GitHub yet.",
  "update.error.fetch":
    "The published versions could not be checked. There may not be any available yet.",
  "update.error.network":
    "There is no connection to GitHub. Check your internet connection and try again.",

  "mini.empty": "There are no active timers.",
  "mini.stop": "Stop",
  "mini.normalView": "Normal view",
  "tray.show": "Show",
  "tray.quit": "Quit",
  "tray.status": "{count} running · {time} today",

  "error.noSession": "No session is active.",
  "api.ctx.login": "Login",
  "api.ctx.timesheet": "Get timesheet",
  "api.ctx.submit": "Send hours",
  "api.ctx.language": "Get language",
  "api.unexpected": "Unexpected response from ITM Platform ({context}): {detail}",
  "api.noToken": "No valid session token was received. Check the company and the API Key.",
};

const pt: Dictionary = {
  "common.ok": "OK",
  "common.cancel": "Cancelar",
  "common.close": "Fechar",
  "common.save": "Salvar",
  "common.retry": "Tentar novamente",
  "app.loading": "Carregando…",
  "app.poweredBy": "Desenvolvido pela Actual Solutions",

  "settings.title": "Conectar ao ITM Platform",
  "settings.hint":
    "Informe o identificador da sua empresa (o que você usa para acessar o ITM Platform) e a sua API Key pessoal, disponível no seu perfil do ITM Platform.",
  "settings.demoHint":
    "Ambiente de demonstração {company}. Informe a API Key do seu usuário neste ambiente.",
  "settings.company": "Empresa (company URL)",
  "settings.companyPlaceholder": "minhaempresa",
  "settings.apiKey": "API Key",
  "settings.connect": "Conectar",
  "settings.connecting": "Conectando…",
  "settings.connectError": "Não foi possível conectar ao ITM Platform.",

  "header.search": "Pesquisar tarefa ou projeto…",
  "header.miniMode": "Modo mini",
  "header.switchAccount": "Trocar conta",
  "header.today": "Hoje",
  "header.refresh": "Atualizar tarefas",
  "header.refreshing": "Atualizando…",
  "week.previous": "Semana anterior",
  "week.next": "Próxima semana",
  "week.summary":
    "Semana {range}: {reported} no ITM + {pending} não enviadas = {total} de {target} ({percent}%)",

  "list.loading": "Carregando tarefas…",
  "list.loadError": "Não foi possível carregar o timesheet.",
  "list.expandAll": "Expandir tudo",
  "list.collapseAll": "Recolher tudo",
  "list.empty": "Nenhuma tarefa encontrada para este período.",
  "list.projectDay": "{day}: {time}",
  "list.projectWeek": "Semana: {time}",
  "list.projectUnsent": "Não enviadas: {time}",
  "filter.all": "Todas as tarefas",
  "filter.favorites": "Destacadas",
  "filter.active": "Com cronômetro ativo",

  "task.favorite.add": "Marcar como destacada",
  "task.favorite.remove": "Remover das destacadas",
  "task.reported": "{day}: {time} reportadas",
  "task.unsentOn": " · {time} não enviadas ({date})",
  "task.otherDayNote":
    "Tem {time} não enviadas de {date}. Para registrar tempo de outro dia nesta tarefa, envie primeiro essas horas.",
  "task.noTimeAllowed": "Esta tarefa não permite lançamento de horas neste dia.",
  "task.startLabel": "Início:",
  "task.startedAt": "Iniciado às {time} · ajustar",
  "task.notePlaceholder": "Nota (opcional)",
  "task.manualPlaceholder": "h:mm",
  "task.manualAdd": "Adicionar",
  "task.manualToggle": "Adicionar tempo manualmente",
  "task.edit": "Editar",
  "task.start": "Iniciar",
  "task.pause": "Pausar",
  "task.error.amount": "Não foi possível corrigir o tempo.",
  "task.error.start": "Não foi possível ajustar o horário de início.",
  "task.error.generic": "Não foi possível registrar o tempo.",

  "sync.pendingOne": "{count} tarefa com {time} não enviadas",
  "sync.pendingMany": "{count} tarefas com {time} não enviadas",
  "sync.allSynced": "Tudo sincronizado",
  "sync.itemErrors": "Algumas tarefas não puderam ser enviadas: {errors}",
  "sync.review": "Revisar e enviar",
  "sync.pendingDetail": "{summary} — {breakdown}",
  "sync.error.send": "Não foi possível enviar as horas.",
  "sync.error.generic": "Erro ao enviar as horas ao ITM Platform.",
  "review.title": "Revisar antes de enviar",
  "review.loading": "Consultando o que já foi reportado no ITM Platform…",
  "review.loadError": "Não foi possível consultar o que já foi reportado no ITM Platform.",
  "review.empty": "Não há tempo pendente para enviar.",
  "review.confirm": "Confirmar e enviar ({count})",
  "review.sending": "Enviando…",
  "review.alreadyReported": "Já reportado: {time}",
  "review.pending": "Pendente",
  "review.running": "{time} (em andamento)",
  "review.otherDate": "Estas horas serão registradas em {date}, não hoje.",
  "review.total": "Total a enviar: {time}",

  "fav.title": "Tarefas destacadas de hoje",
  "fav.ask":
    "Deseja redefinir a sua lista de tarefas destacadas? A prioridade pode ser diferente a cada dia.",
  "fav.noneNow": "No momento você não tem nenhuma tarefa destacada.",
  "fav.countOne": "No momento você tem 1 tarefa destacada.",
  "fav.countMany": "No momento você tem {count} tarefas destacadas.",
  "fav.keep": "Não, manter a lista",
  "fav.reset": "Sim, redefinir",
  "fav.pickTitle": "Marque as suas tarefas destacadas de hoje",
  "fav.cancelKeep": "Cancelar (manter a lista anterior)",
  "fav.save": "Salvar destacadas ({count})",

  "day.progressLabel": "Horas do dia em relação à jornada",
  "day.nonWorking": "Dia não útil",
  "day.summary": "{total} de {target}",
  "day.summaryNonWorking": "{total} · dia não útil",
  "day.inItm": "No ITM {time}",
  "day.unsent": "Não enviadas {time}",
  "day.workday": "Jornada {time}",
  "day.otherDays": "Outros dias {time}",
  "day.otherDaysHint":
    "Tempo não enviado de outras datas. Não conta na porcentagem deste dia, mas está incluído no total da barra inferior. Clique para revisar essas horas.",

  "reminders.title": "Lembretes",
  "reminders.disabled": "Desativados",
  "reminders.noTimer": "Lembrar-me se não houver nenhum cronômetro ativo",
  "reminders.every": "A cada",
  "reminders.minutes": "minutos",
  "reminders.stillWorking": "Perguntar se continuo trabalhando enquanto houver um cronômetro ativo",
  "reminder.noTimerTitle": "Lembrete de timesheet",
  "reminder.noTimerBody": "Você não tem nenhum cronômetro ativo. No que está trabalhando agora?",
  "reminder.activeTitle": "Cronômetro ativo",
  "reminder.activeOne": "Continua em andamento: {task}. Você continua trabalhando nesta tarefa?",
  "reminder.activeMany":
    "{count} cronômetros continuam em andamento: {tasks}. Você continua trabalhando nelas?",

  "autoLaunch.title": "Iniciar com o sistema",
  "autoLaunch.checkbox": "Iniciar o aplicativo ao entrar no sistema",
  "autoLaunch.hintOn": "Ao iniciar com o sistema, o aplicativo fica na bandeja até você abri-lo.",
  "autoLaunch.hintUnsupported":
    "Disponível apenas no aplicativo instalado, não no modo de desenvolvimento.",

  "update.available": "Atualizar para v{version}",
  "update.downloading": "Baixando… {percent}%",
  "update.installed": "Versão instalada: v{version}",
  "update.unsupported":
    "As atualizações automáticas só estão disponíveis no aplicativo instalado para Windows.",
  "update.checking": "Procurando atualizações…",
  "update.newVersion": "Há uma nova versão: v{version}.",
  "update.download": "Baixar",
  "update.downloadingVersion": "Baixando v{version}… {percent}%",
  "update.ready":
    "A versão v{version} foi baixada. O aplicativo será fechado e reaberto ao instalar.",
  "update.install": "Reiniciar e instalar",
  "update.errorFallback": "Não foi possível concluir a atualização.",
  "update.upToDate": "Você está atualizado.",
  "update.check": "Verificar atualizações",
  "update.notifyTitle": "Nova versão disponível",
  "update.notifyBody":
    "O ITM Platform Timesheet {version} está pronto para baixar. Abra-o para atualizar.",
  "update.error.noReleases": "Ainda não há versões publicadas no GitHub.",
  "update.error.fetch":
    "Não foi possível consultar as versões publicadas. Pode ser que ainda não haja nenhuma disponível.",
  "update.error.network":
    "Não há conexão com o GitHub. Verifique sua conexão com a internet e tente novamente.",

  "mini.empty": "Não há cronômetros ativos.",
  "mini.stop": "Parar",
  "mini.normalView": "Visão normal",
  "tray.show": "Mostrar",
  "tray.quit": "Sair",
  "tray.status": "{count} em andamento · {time} hoje",

  "error.noSession": "Nenhuma sessão iniciada.",
  "api.ctx.login": "Login",
  "api.ctx.timesheet": "Obter timesheet",
  "api.ctx.submit": "Enviar horas",
  "api.ctx.language": "Obter idioma",
  "api.unexpected": "Resposta inesperada do ITM Platform ({context}): {detail}",
  "api.noToken": "Não foi recebido um token de sessão válido. Verifique a empresa e a API Key.",
};

const DICTIONARIES: Record<Language, Dictionary> = { es, en, pt };

/** Traduce una clave al idioma indicado sustituyendo los {parámetros}. */
export function translate(
  language: Language,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  let text = DICTIONARIES[language][key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

// --- Idioma actual del proceso principal (notificaciones, bandeja, mensajes de error) ---

let currentLanguage: Language = DEFAULT_LANGUAGE;

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setCurrentLanguage(language: Language): void {
  currentLanguage = language;
}

/** Traducción en el idioma actual del proceso principal. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return translate(currentLanguage, key, params);
}
