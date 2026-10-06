import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import type { UpdateStatus } from "./types";

// Primera comprobación poco después de arrancar (no compite con el login) y luego periódica.
const FIRST_CHECK_DELAY_MS = 30_000;
const CHECK_EVERY_MS = 4 * 60 * 60_000;

interface UpdaterOptions {
  getWindow: () => BrowserWindow | null;
  /** Se llama una vez por versión nueva detectada en una comprobación automática. */
  onNewVersion: (version: string) => void;
  /** Se llama justo antes de cerrar la app para instalar la actualización. */
  beforeInstall: () => void;
}

let options: UpdaterOptions;
let supported = false;
let silentCheck = true;
let notifiedVersion: string | null = null;
let status: UpdateStatus = { state: "unsupported", currentVersion: "" };

function setStatus(next: Partial<UpdateStatus> & Pick<UpdateStatus, "state">) {
  status = { currentVersion: status.currentVersion, ...next };
  options.getWindow()?.webContents.send("updater:status", status);
}

export function getUpdateStatus(): UpdateStatus {
  return status;
}

export function initUpdater(opts: UpdaterOptions) {
  options = opts;
  // Por ahora solo Windows: en macOS la app no está firmada y no puede instalarse sola.
  supported = app.isPackaged && process.platform === "win32";
  status = { state: supported ? "idle" : "unsupported", currentVersion: app.getVersion() };
  if (!supported) return;

  // El usuario decide cuándo descargar e instalar.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () => setStatus({ state: "checking" }));
  autoUpdater.on("update-available", (info) => {
    setStatus({ state: "available", version: info.version });
    if (silentCheck && notifiedVersion !== info.version) {
      notifiedVersion = info.version;
      options.onNewVersion(info.version);
    }
  });
  autoUpdater.on("update-not-available", () => setStatus({ state: "not-available" }));
  autoUpdater.on("download-progress", (p) =>
    setStatus({ state: "downloading", version: status.version, percent: Math.round(p.percent) })
  );
  autoUpdater.on("update-downloaded", (info) =>
    setStatus({ state: "downloaded", version: info.version })
  );
  autoUpdater.on("error", (err) => {
    console.error("[updater]", err);
    // Una comprobación automática que falla (sin red, repo aún privado…) no debe molestar.
    if (silentCheck && status.state !== "downloading") setStatus({ state: "idle" });
    else setStatus({ state: "error", version: status.version, error: err?.message ?? String(err) });
  });

  setTimeout(() => checkForUpdates(false), FIRST_CHECK_DELAY_MS);
  setInterval(() => checkForUpdates(false), CHECK_EVERY_MS);
}

export function checkForUpdates(manual: boolean) {
  if (!supported) return;
  // No interrumpir una descarga ni volver a ofrecer lo que ya está descargado.
  if (status.state === "checking" || status.state === "downloading" || status.state === "downloaded") {
    return;
  }
  silentCheck = !manual;
  autoUpdater.checkForUpdates().catch(() => {
    // El detalle ya llega por el evento "error".
  });
}

export function downloadUpdate() {
  if (!supported || status.state !== "available") return;
  silentCheck = false;
  setStatus({ state: "downloading", version: status.version, percent: 0 });
  autoUpdater.downloadUpdate().catch(() => {
    // El detalle ya llega por el evento "error".
  });
}

export function installUpdate() {
  if (!supported || status.state !== "downloaded") return;
  // Sin esto, el manejador "close" de la ventana (que la oculta a la bandeja) bloquearía el cierre.
  options.beforeInstall();
  autoUpdater.quitAndInstall(true, true);
}
