import { app, BrowserWindow, ipcMain, Menu, Notification, Tray, nativeImage, screen, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as itm from "./itmClient";
import * as store from "./store";
import type { AppState, Credentials, ReminderSettings, SubmitTimeEntriesRequest } from "./types";
import { emptyAppState } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

const NORMAL_SIZE = { width: 1100, height: 760 };
const NORMAL_MIN_SIZE = { width: 820, height: 560 };
const MINI_SIZE = { width: 300, height: 220 };

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let normalBounds: Electron.Rectangle | null = null;
let cachedState: AppState = emptyAppState();
let reminderTimer: ReturnType<typeof setInterval> | null = null;

// Evita que se abran varias copias de la app a la vez: cada instancia tendría su propio
// estado en memoria (cachedState) y podría desincronizarse de lo que el usuario ve en pantalla
// (por ejemplo, disparando recordatorios de "sin temporizador activo" mientras otra instancia
// sí tiene uno corriendo). Si ya hay una instancia corriendo, esta simplemente enfoca esa ventana y sale.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

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

function createTray() {
  const icon = nativeImage.createFromPath(iconPath());
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("ITM Platform Timesheet");
  updateTrayMenu();
  tray.on("double-click", () => {
    mainWindow?.show();
  });
}

function updateTrayMenu(statusLabel?: string) {
  if (!tray) return;
  tray.setToolTip(statusLabel ? `ITM Platform Timesheet — ${statusLabel}` : "ITM Platform Timesheet");
  const menu = Menu.buildFromTemplate([
    { label: "Mostrar", click: () => mainWindow?.show() },
    { type: "separator" },
    {
      label: "Salir",
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

function fireReminder() {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: "Recordatorio de timesheet",
      body: "No tienes ningún temporizador activo. ¿En qué estás trabajando ahora?",
      icon: iconPath(),
      silent: true,
    });
    notification.on("click", () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    notification.show();
  }
  shell.beep();
}

function restartReminderTimer(settings: ReminderSettings) {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
  if (!settings.enabled) return;
  const intervalMs = Math.max(1, settings.intervalMinutes) * 60_000;
  reminderTimer = setInterval(() => {
    if (!hasRunningTimer()) fireReminder();
  }, intervalMs);
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.whenReady().then(async () => {
  app.setAppUserModelId("tech.actualsolutions.itmplatformtimesheet");
  createWindow();
  createTray();
  cachedState = await store.loadAppState();
  restartReminderTimer(await store.loadReminderSettings());

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

// ---------- IPC ----------

function requireSession() {
  return store.loadSession();
}

ipcMain.handle("itm:login", async (_e, creds: Credentials) => {
  const res = await itm.login(creds.company, creds.apiKey);
  await store.saveCredentials(creds);
  await store.saveSession({ token: res.Token, userId: res.UserID });
  return res;
});

ipcMain.handle("itm:logout", async () => {
  await store.clearCredentials();
  await store.clearSession();
});

ipcMain.handle("itm:getStoredAccount", async () => {
  const creds = await store.loadCredentials();
  const session = await store.loadSession();
  if (!creds || !session) return null;
  return { company: creds.company, userId: session.userId };
});

ipcMain.handle(
  "itm:getTimesheet",
  async (_e, args: { startDate: string; endDate: string }) => {
    const creds = await store.loadCredentials();
    const session = await requireSession();
    if (!creds || !session) throw new Error("No hay una sesión iniciada.");
    try {
      return await itm.getTimesheet(creds.company, session.token, args.startDate, args.endDate);
    } catch (err) {
      if (err instanceof itm.ItmApiError && err.status === 401) {
        const relogged = await itm.login(creds.company, creds.apiKey);
        await store.saveSession({ token: relogged.Token, userId: relogged.UserID });
        return await itm.getTimesheet(
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

ipcMain.handle(
  "itm:submitTimeEntries",
  async (_e, payload: SubmitTimeEntriesRequest) => {
    const creds = await store.loadCredentials();
    const session = await requireSession();
    if (!creds || !session) throw new Error("No hay una sesión iniciada.");
    try {
      return await itm.submitTimeEntries(creds.company, session.token, payload);
    } catch (err) {
      if (err instanceof itm.ItmApiError && err.status === 401) {
        const relogged = await itm.login(creds.company, creds.apiKey);
        await store.saveSession({ token: relogged.Token, userId: relogged.UserID });
        return await itm.submitTimeEntries(creds.company, relogged.Token, payload);
      }
      throw err;
    }
  }
);

ipcMain.handle("state:load", async (): Promise<AppState> => {
  return store.loadAppState();
});

ipcMain.handle("state:save", async (_e, state: AppState) => {
  cachedState = state;
  await store.saveAppState(state);
});

ipcMain.handle("tray:updateStatus", async (_e, label: string | undefined) => {
  updateTrayMenu(label);
});

ipcMain.handle("window:setMiniMode", async (_e, enabled: boolean) => {
  setMiniMode(enabled);
});

ipcMain.handle("reminder:getSettings", async (): Promise<ReminderSettings> => {
  return store.loadReminderSettings();
});

ipcMain.handle("reminder:setSettings", async (_e, settings: ReminderSettings) => {
  await store.saveReminderSettings(settings);
  restartReminderTimer(settings);
});
