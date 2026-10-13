import { app, BrowserWindow, dialog, ipcMain, Menu, Notification, Tray, nativeImage, screen, shell } from "electron";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as itm from "./itmClient";
import * as store from "./store";
import * as updater from "./updater";
import * as sendLog from "./sendLog";
import * as appLog from "./appLog";
import {
  DEFAULT_LANGUAGE,
  getCurrentLanguage,
  parseLanguage,
  setCurrentLanguage,
  t as tr,
} from "./i18n";
import type { Language } from "./i18n";
import type {
  AppMode,
  AppState,
  AutoLaunchSettings,
  Credentials,
  ReminderSettings,
  SendAuditItem,
  SendLogEntry,
  SubmitTimeEntriesRequest,
  SubmitTimeEntriesResponse,
} from "./types";
import {
  DEMO_COMPANY,
  DEMO_HOST,
  PRODUCTION_HOST,
  defaultReminderSettings,
  emptyAppState,
} from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

// Único sitio externo que la app puede abrir desde un enlace (pie "Desarrollado por Actual Solutions").
const EXTERNAL_LINK_PREFIX = "https://actualsolutions.tech/";

const NORMAL_SIZE ={ width: 1100, height: 760 };
const NORMAL_MIN_SIZE = { width: 820, height: 560 };
const MINI_SIZE = { width: 300, height: 220 };

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let normalBounds: Electron.Rectangle | null = null;
let cachedState: AppState = emptyAppState();

// Modo demo (oculto): API https://demo-api.itmplatform.com y empresa fija. Tiene su propio
// perfil de credenciales y estado, aislado del de producción. Se activa desde la propia app
// (gesto oculto) o arrancando con el argumento --demo, que además lo bloquea.
let demoMode = false;
let demoLocked = false;

function currentHost(): string {
  return demoMode ? DEMO_HOST : PRODUCTION_HOST;
}

function currentMode(): AppMode {
  return { demo: demoMode, locked: demoLocked, fixedCompany: demoMode ? DEMO_COMPANY : "" };
}

function appTitle(): string {
  return demoMode ? "ITM Platform Timesheet (DEMO)" : "ITM Platform Timesheet";
}
let reminderTimer: ReturnType<typeof setInterval> | null = null;
let reminderSettings: ReminderSettings = defaultReminderSettings();
// Último aviso (o inicio de seguimiento) de "¿sigues trabajando?" por temporizador activo; key: workItemId.
const lastActiveCheckAt = new Map<string, number>();

// Argumento con el que el sistema arranca la app al iniciar sesión, para que quede en la bandeja
// en lugar de abrir la ventana principal.
const AUTO_LAUNCH_ARGS = ["--hidden"];
const ACTIVE_CHECK_TICK_MS = 15_000;
const startedHidden =
  process.argv.includes(AUTO_LAUNCH_ARGS[0]) || app.getLoginItemSettings().wasOpenedAtLogin;

// Evita que se abran varias copias de la app a la vez: cada instancia tendría su propio
// estado en memoria (cachedState) y podría desincronizarse de lo que el usuario ve en pantalla
// (por ejemplo, disparando recordatorios de "sin temporizador activo" mientras otra instancia
// sí tiene uno corriendo). Si ya hay una instancia corriendo, esta simplemente enfoca esa ventana y sale.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    appLog.info("app", "Se intentó abrir una segunda copia: se enfoca la ventana existente");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Errores que nadie captura: se anotan en el registro para poder diagnosticarlos.
process.on("uncaughtException", (err) => appLog.error("main", "Excepción no controlada", err));
process.on("unhandledRejection", (reason) => appLog.error("main", "Promesa rechazada sin controlar", reason));
app.on("child-process-gone", (_e, details) =>
  appLog.error("main", `Proceso interno terminado (${details.type}): ${details.reason}`, details)
);

// Tras un fallo visible (pantalla en blanco, proceso de la interfaz caído) se ofrece guardar el registro.
let diagnosticsOffered = false;
const BLANK_CHECK_DELAY_MS = 6_000;

/** Guarda el registro de diagnóstico donde el usuario elija (por defecto, el escritorio). */
async function exportDiagnostics(): Promise<{ ok: boolean; path?: string; cancelled?: boolean }> {
  const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  const options: Electron.SaveDialogOptions = {
    title: tr("diag.saveTitle"),
    defaultPath: path.join(
      app.getPath("desktop"),
      `diagnostico-itm-timesheet-${new Date().toISOString().slice(0, 10)}.txt`
    ),
    filters: [{ name: "TXT", extensions: ["txt"] }],
  };
  try {
    const target = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (target.canceled || !target.filePath) return { ok: false, cancelled: true };
    await fsp.writeFile(target.filePath, await appLog.buildReport(), "utf-8");
    appLog.info("diag", "Informe de diagnóstico guardado");
    shell.showItemInFolder(target.filePath);
    return { ok: true, path: target.filePath };
  } catch (err) {
    appLog.error("diag", "No se pudo guardar el informe de diagnóstico", err);
    return { ok: false };
  }
}

async function offerDiagnostics(reason: string) {
  if (diagnosticsOffered || !mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) return;
  diagnosticsOffered = true;
  appLog.warn("diag", `Se ofrece guardar el registro: ${reason}`);
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: tr("diag.problemTitle"),
    message: tr("diag.problemTitle"),
    detail: tr("diag.problemBody"),
    buttons: [tr("diag.button"), tr("diag.reload"), tr("common.close")],
    defaultId: 0,
    cancelId: 2,
  });
  if (response === 0) await exportDiagnostics();
  else if (response === 1) mainWindow?.webContents.reload();
}

/** Comprueba que la interfaz haya pintado algo; si la ventana sigue en blanco, lo anota y avisa. */
async function checkWindowNotBlank() {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  try {
    const children: number = await win.webContents.executeJavaScript(
      `document.getElementById("root")?.childElementCount ?? -1`
    );
    if (children > 0) {
      appLog.info("window", "La interfaz se mostró correctamente");
      return;
    }
    appLog.error("window", `Ventana en blanco: el contenedor de la interfaz está vacío (${children})`);
    await offerDiagnostics("ventana en blanco");
  } catch (err) {
    appLog.error("window", "No se pudo comprobar si la ventana está en blanco", err);
  }
}

function iconPath(): string {
  return path.join(process.env.APP_ROOT!, "build", "icon.png");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: NORMAL_SIZE.width,
    height: NORMAL_SIZE.height,
    minWidth: NORMAL_MIN_SIZE.width,
    minHeight: NORMAL_MIN_SIZE.height,
    title: "ITM Platform Timesheet",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const wc = mainWindow.webContents;
  wc.on("did-finish-load", () => {
    appLog.info("window", "Interfaz cargada");
    setTimeout(checkWindowNotBlank, BLANK_CHECK_DELAY_MS);
  });
  wc.on("did-fail-load", (_e, code, description, url, isMainFrame) => {
    if (code === -3) return; // carga cancelada (p. ej. una recarga)
    appLog.error("window", `Falló la carga${isMainFrame ? "" : " (subrecurso)"}: ${description} (${code})`, url);
    if (isMainFrame) offerDiagnostics("falló la carga de la interfaz");
  });
  wc.on("render-process-gone", (_e, details) => {
    appLog.error("window", `Proceso de la interfaz caído: ${details.reason} (código ${details.exitCode})`);
    offerDiagnostics("proceso de la interfaz caído");
  });
  wc.on("preload-error", (_e, preloadPath, err) =>
    appLog.error("window", `Falló el script de precarga ${preloadPath}`, err)
  );
  // Electron 33 entrega (event, level, message, line, sourceId); versiones posteriores, un único objeto.
  wc.on("console-message", (...args: any[]) => {
    const details = typeof args[0]?.message === "string" ? args[0] : null;
    const level = details ? ({ debug: 0, info: 1, warning: 2, error: 3 } as Record<string, number>)[details.level] ?? 1 : args[1];
    if (typeof level !== "number" || level < 2) return;
    const message = details ? details.message : args[2];
    const source = details ? details.sourceId : args[4];
    const line = details ? details.lineNumber : args[3];
    appLog.log(level >= 3 ? "ERROR" : "WARN", "consola", String(message), `${source}:${line}`);
  });
  mainWindow.on("unresponsive", () => appLog.warn("window", "La ventana no responde"));
  mainWindow.on("responsive", () => appLog.info("window", "La ventana vuelve a responder"));
  mainWindow.on("show", () => appLog.info("window", "Ventana mostrada"));
  mainWindow.on("hide", () => appLog.info("window", "Ventana oculta (bandeja)"));

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  // Los enlaces nunca navegan dentro de la ventana de la app: los de Actual Solutions
  // se abren en el navegador del sistema y cualquier otro se descarta.
  const openIfAllowed = (url: string) => {
    if (url.startsWith(EXTERNAL_LINK_PREFIX)) shell.openExternal(url);
  };
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openIfAllowed(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url === mainWindow?.webContents.getURL()) return;
    event.preventDefault();
    openIfAllowed(url);
  });

  mainWindow.once("ready-to-show", () => {
    if (!startedHidden) mainWindow?.show();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function trayIconPath(): string {
  // El .ico trae varios tamaños (16–256 px) y Windows elige el adecuado para la bandeja.
  const file = process.platform === "win32" ? "icon.ico" : "icon.png";
  return path.join(process.env.APP_ROOT!, "build", file);
}

function createTray() {
  let icon = nativeImage.createFromPath(trayIconPath());
  // El PNG original es de 1024 px: fuera de Windows hay que reducirlo al tamaño de la bandeja.
  if (process.platform !== "win32" && !icon.isEmpty()) icon = icon.resize({ width: 16, height: 16 });
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  updateTrayMenu();
  tray.on("double-click", () => {
    mainWindow?.show();
  });
}

let trayStatusLabel: string | undefined;

function updateTrayMenu(statusLabel?: string) {
  trayStatusLabel = statusLabel;
  rebuildTray();
}

function rebuildTray() {
  if (!tray) return;
  tray.setToolTip(trayStatusLabel ? `${appTitle()} — ${trayStatusLabel}` : appTitle());
  const menu = Menu.buildFromTemplate([
    { label: tr("tray.show"), click: () => mainWindow?.show() },
    {
      label: tr("tray.diagnostics"),
      click: () => {
        mainWindow?.show();
        exportDiagnostics();
      },
    },
    { type: "separator" },
    {
      label: tr("tray.quit"),
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

function setMiniMode(enabled: boolean) {
  if (!mainWindow) return;
  mainWindow.show();
  if (enabled) {
    normalBounds = mainWindow.getBounds();
    const { workArea } = screen.getPrimaryDisplay();
    const x = workArea.x + workArea.width - MINI_SIZE.width - 16;
    const y = workArea.y + workArea.height - MINI_SIZE.height - 16;
    mainWindow.setMinimumSize(MINI_SIZE.width, MINI_SIZE.height);
    mainWindow.setResizable(false);
    mainWindow.setBounds({ x, y, width: MINI_SIZE.width, height: MINI_SIZE.height });
    mainWindow.setAlwaysOnTop(true, "floating");
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(NORMAL_MIN_SIZE.width, NORMAL_MIN_SIZE.height);
    if (normalBounds) {
      mainWindow.setBounds(normalBounds);
    } else {
      mainWindow.setSize(NORMAL_SIZE.width, NORMAL_SIZE.height);
      mainWindow.center();
    }
  }
}

function hasRunningTimer(): boolean {
  return Object.values(cachedState.timers).some((t) => t.running);
}

function notify(title: string, body: string, beep = true) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: iconPath(),
      silent: true,
    });
    notification.on("click", () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    notification.show();
  }
  if (beep) shell.beep();
}

function fireReminder() {
  notify(tr("reminder.noTimerTitle"), tr("reminder.noTimerBody"));
}

function restartReminderTimer(settings: ReminderSettings) {
  reminderSettings = settings;
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
  // Reinicia la cuenta de los avisos de temporizador activo para que un cambio de
  // intervalo (o reactivar la opción) no dispare un aviso inmediato por tiempo acumulado.
  lastActiveCheckAt.clear();
  syncActiveCheckTracking();
  if (!settings.enabled) return;
  const intervalMs = Math.max(1, settings.intervalMinutes) * 60_000;
  reminderTimer = setInterval(() => {
    if (!hasRunningTimer()) fireReminder();
  }, intervalMs);
}

/** Alinea el seguimiento de avisos con los temporizadores que están corriendo ahora mismo. */
function syncActiveCheckTracking() {
  const now = Date.now();
  const runningKeys = new Set<string>();
  for (const [key, timer] of Object.entries(cachedState.timers)) {
    if (!timer.running) continue;
    runningKeys.add(key);
    if (!lastActiveCheckAt.has(key)) lastActiveCheckAt.set(key, now);
  }
  for (const key of lastActiveCheckAt.keys()) {
    if (!runningKeys.has(key)) lastActiveCheckAt.delete(key);
  }
}

/** Avisa "¿sigues trabajando?" por cada temporizador activo cada N minutos mientras siga corriendo. */
function checkActiveTimers() {
  if (!reminderSettings.activeCheckEnabled) return;
  const now = Date.now();
  const intervalMs = Math.max(1, reminderSettings.activeCheckIntervalMinutes) * 60_000;
  const due: string[] = [];
  for (const [key, timer] of Object.entries(cachedState.timers)) {
    if (!timer.running) continue;
    const last = lastActiveCheckAt.get(key) ?? now;
    if (now - last >= intervalMs) {
      lastActiveCheckAt.set(key, now);
      due.push(`${timer.taskName} (${timer.projectName})`);
    }
  }
  if (due.length === 0) return;
  notify(
    tr("reminder.activeTitle"),
    due.length === 1
      ? tr("reminder.activeOne", { task: due[0] })
      : tr("reminder.activeMany", { count: due.length, tasks: due.join(", ") })
  );
}

function getAutoLaunch(): AutoLaunchSettings {
  return {
    enabled: app.getLoginItemSettings({ args: AUTO_LAUNCH_ARGS }).openAtLogin,
    supported: app.isPackaged,
  };
}

function setAutoLaunch(enabled: boolean): AutoLaunchSettings {
  // Sin empaquetar, el ejecutable sería electron.exe: no lo registramos como programa de inicio.
  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: enabled, args: AUTO_LAUNCH_ARGS });
  }
  return getAutoLaunch();
}

app.on("before-quit", () => {
  isQuitting = true;
  appLog.info("app", "Cierre de la aplicación");
});

app.whenReady().then(async () => {
  app.setAppUserModelId("tech.actualsolutions.itmplatformtimesheet");
  demoLocked = process.argv.includes("--demo");
  appLog.logStartup({ iniciadaOculta: startedHidden });
  appLog.logDisplays();
  demoMode = demoLocked || (await store.loadDemoFlag());
  store.setProfile(demoMode);
  appLog.info("app", `Entorno: ${demoMode ? "demo" : "producción"}`);
  sendLog.purgeOld(store.sendLogPath()).catch((err) => console.warn("[sendLog] purga:", err));
  setCurrentLanguage(
    (await store.loadLanguage()) ?? parseLanguage(app.getLocale()) ?? DEFAULT_LANGUAGE
  );
  createWindow();
  createTray();
  cachedState = await store.loadAppState();
  restartReminderTimer(await store.loadReminderSettings());
  setInterval(checkActiveTimers, ACTIVE_CHECK_TICK_MS);
  appLog.info("app", "Inicialización completada");
  updater.initUpdater({
    getWindow: () => mainWindow,
    onNewVersion: (version) =>
      notify(tr("update.notifyTitle"), tr("update.notifyBody", { version }), false),
    beforeInstall: () => {
      isQuitting = true;
    },
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

// ---------- IPC ----------

// Llamadas de la interfaz que se repiten constantemente: solo se anotan si fallan.
const QUIET_CHANNELS = new Set([
  "state:save",
  "state:load",
  "tray:updateStatus",
  "updater:getStatus",
  "language:get",
  "mode:get",
]);

/** Como ipcMain.handle, pero deja en el registro cada llamada (sin sus datos) y cualquier error. */
function handle(channel: string, listener: Parameters<typeof ipcMain.handle>[1]) {
  ipcMain.handle(channel, async (event, ...args) => {
    const started = Date.now();
    try {
      const result = await listener(event, ...args);
      if (!QUIET_CHANNELS.has(channel)) appLog.info("ipc", `${channel} correcto (${Date.now() - started} ms)`);
      return result;
    } catch (err) {
      appLog.error("ipc", `${channel} falló (${Date.now() - started} ms)`, err);
      throw err;
    }
  });
}

// Errores y avisos de la interfaz (React): llegan por el puente del preload. Con tope para no inundar el archivo.
let rendererEntries = 0;
const MAX_RENDERER_ENTRIES = 300;
ipcMain.on("log:renderer", (_e, level: unknown, message: unknown, detail: unknown) => {
  if (rendererEntries++ >= MAX_RENDERER_ENTRIES) return;
  const lvl = level === "error" ? "ERROR" : level === "warn" ? "WARN" : "INFO";
  appLog.log(lvl, "interfaz", String(message).slice(0, 1000), typeof detail === "string" ? detail : undefined);
});

handle("diag:export", async () => exportDiagnostics());

function requireSession() {
  return store.loadSession();
}

handle("itm:login", async (_e, creds: Credentials) => {
  // En modo demo la empresa es fija, venga lo que venga del formulario.
  const company = demoMode ? DEMO_COMPANY : creds.company;
  const res = await itm.login(currentHost(), company, creds.apiKey);
  await store.saveCredentials({ company, apiKey: creds.apiKey });
  await store.saveSession({ token: res.Token, userId: res.UserID });
  return res;
});

handle("itm:logout", async () => {
  await store.clearCredentials();
  await store.clearSession();
});

handle("itm:getStoredAccount", async () => {
  const creds = await store.loadCredentials();
  const session = await store.loadSession();
  if (!creds || !session) return null;
  return { company: creds.company, userId: session.userId };
});

handle(
  "itm:getTimesheet",
  async (_e, args: { startDate: string; endDate: string }) => {
    const creds = await store.loadCredentials();
    const session = await requireSession();
    if (!creds || !session) throw new Error(tr("error.noSession"));
    try {
      return await itm.getTimesheet(
        currentHost(),
        creds.company,
        session.token,
        args.startDate,
        args.endDate
      );
    } catch (err) {
      if (err instanceof itm.ItmApiError && err.status === 401) {
        const relogged = await itm.login(currentHost(), creds.company, creds.apiKey);
        await store.saveSession({ token: relogged.Token, userId: relogged.UserID });
        return await itm.getTimesheet(
          currentHost(),
          creds.company,
          relogged.Token,
          args.startDate,
          args.endDate
        );
      }
      throw err;
    }
  }
);

handle(
  "itm:submitTimeEntries",
  async (
    _e,
    args: { payload: SubmitTimeEntriesRequest; audit: SendAuditItem[] }
  ): Promise<SubmitTimeEntriesResponse> => {
    const { payload, audit } = args;
    const creds = await store.loadCredentials();
    const session = await requireSession();
    if (!creds || !session) throw new Error(tr("error.noSession"));

    // Registro local (CSV) antes de enviar, y con el resultado después; ver sendLog.sendWithLog.
    return sendLog.sendWithLog({
      file: store.sendLogPath(),
      audit,
      writeError: (detail) => new Error(tr("sendLog.writeError", { detail })),
      send: async () => {
        try {
          return await itm.submitTimeEntries(currentHost(), creds.company, session.token, payload);
        } catch (err) {
          if (!(err instanceof itm.ItmApiError && err.status === 401)) throw err;
          const relogged = await itm.login(currentHost(), creds.company, creds.apiKey);
          await store.saveSession({ token: relogged.Token, userId: relogged.UserID });
          return await itm.submitTimeEntries(currentHost(), creds.company, relogged.Token, payload);
        }
      },
    });
  }
);

handle("sendlog:list", async (): Promise<SendLogEntry[]> => sendLog.readEntries(store.sendLogPath()));

handle("sendlog:reveal", async () => {
  const file = store.sendLogPath();
  try {
    await fsp.access(file);
    shell.showItemInFolder(file);
  } catch {
    await shell.openPath(path.dirname(file));
  }
});

handle("sendlog:export", async (): Promise<{ ok: boolean; path?: string }> => {
  const source = store.sendLogPath();
  const target = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: `informe-envios-${new Date().toISOString().slice(0, 10)}.csv`,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (target.canceled || !target.filePath) return { ok: false };
  try {
    await fsp.copyFile(source, target.filePath);
    return { ok: true, path: target.filePath };
  } catch {
    return { ok: false };
  }
});

/**
 * Lee el idioma de "Mi perfil" en ITM Platform y lo aplica a la app. Si no se puede leer (sin red,
 * sin sesión…) se mantiene el último idioma conocido, y a falta de este, el del sistema.
 */
async function refreshLanguage(): Promise<Language> {
  const creds = await store.loadCredentials();
  const session = await store.loadSession();
  if (!creds || !session) return getCurrentLanguage();
  const fetchRaw = (token: string) =>
    itm.getUserLanguage(currentHost(), creds.company, token, session.userId);
  try {
    let raw: string | null;
    try {
      raw = await fetchRaw(session.token);
    } catch (err) {
      // El token puede haber caducado: se renueva con la API Key y se reintenta una vez.
      if (!(err instanceof itm.ItmApiError) || (err.status !== 401 && err.status !== 400)) throw err;
      const relogged = await itm.login(currentHost(), creds.company, creds.apiKey);
      await store.saveSession({ token: relogged.Token, userId: relogged.UserID });
      raw = await fetchRaw(relogged.Token);
    }
    const parsed = parseLanguage(raw);
    if (parsed) {
      await store.saveLanguage(parsed);
      if (parsed !== getCurrentLanguage()) {
        setCurrentLanguage(parsed);
        rebuildTray();
      }
    }
  } catch (err) {
    console.warn("[language] no se pudo leer el idioma del perfil de ITM Platform:", err);
  }
  return getCurrentLanguage();
}

handle("language:get", async (): Promise<Language> => getCurrentLanguage());
handle("language:refresh", async (): Promise<Language> => refreshLanguage());

handle("mode:get", async (): Promise<AppMode> => currentMode());

handle("mode:set", async (_e, demo: boolean): Promise<{ ok: boolean }> => {
  // Con --demo el modo está bloqueado, y con un temporizador en marcha no se cambia de entorno.
  if (demoLocked || hasRunningTimer()) return { ok: false };
  demoMode = demo === true;
  store.setProfile(demoMode);
  await store.saveDemoFlag(demoMode);
  cachedState = await store.loadAppState();
  setCurrentLanguage(
    (await store.loadLanguage()) ?? parseLanguage(app.getLocale()) ?? DEFAULT_LANGUAGE
  );
  lastActiveCheckAt.clear();
  syncActiveCheckTracking();
  updateTrayMenu();
  return { ok: true };
});

handle("state:load", async (): Promise<AppState> => {
  return store.loadAppState();
});

handle("state:save", async (_e, state: AppState) => {
  cachedState = state;
  syncActiveCheckTracking();
  await store.saveAppState(state);
});

handle("tray:updateStatus", async (_e, label: string | undefined) => {
  updateTrayMenu(label);
});

handle("window:setMiniMode", async (_e, enabled: boolean) => {
  setMiniMode(enabled);
});

handle("reminder:getSettings", async (): Promise<ReminderSettings> => {
  return store.loadReminderSettings();
});

handle("reminder:setSettings", async (_e, settings: ReminderSettings) => {
  await store.saveReminderSettings(settings);
  restartReminderTimer(settings);
});

handle("updater:getStatus", async () => updater.getUpdateStatus());
handle("updater:check", async () => updater.checkForUpdates(true));
handle("updater:download", async () => updater.downloadUpdate());
handle("updater:install", async () => updater.installUpdate());

handle("autoLaunch:get", async (): Promise<AutoLaunchSettings> => {
  return getAutoLaunch();
});

handle("autoLaunch:set", async (_e, enabled: boolean): Promise<AutoLaunchSettings> => {
  return setAutoLaunch(enabled);
});
