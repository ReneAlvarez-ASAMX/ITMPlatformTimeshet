import { contextBridge, ipcRenderer } from "electron";
import type { Language } from "./i18n";
import type {
  AppMode,
  AppState,
  AutoLaunchSettings,
  Credentials,
  LoginResponse,
  ReminderSettings,
  SubmitTimeEntriesRequest,
  SubmitTimeEntriesResponse,
  TimesheetResponse,
  UpdateStatus,
} from "./types";

const api = {
  login: (creds: Credentials): Promise<LoginResponse> =>
    ipcRenderer.invoke("itm:login", creds),

  logout: (): Promise<void> => ipcRenderer.invoke("itm:logout"),

  getStoredAccount: (): Promise<{ company: string; userId: string } | null> =>
    ipcRenderer.invoke("itm:getStoredAccount"),

  getTimesheet: (startDate: string, endDate: string): Promise<TimesheetResponse> =>
    ipcRenderer.invoke("itm:getTimesheet", { startDate, endDate }),

  submitTimeEntries: (
    payload: SubmitTimeEntriesRequest
  ): Promise<SubmitTimeEntriesResponse> =>
    ipcRenderer.invoke("itm:submitTimeEntries", payload),

  getLanguage: (): Promise<Language> => ipcRenderer.invoke("language:get"),

  /** Vuelve a leer el idioma de "Mi perfil" en ITM Platform y devuelve el que debe usar la app. */
  refreshLanguage: (): Promise<Language> => ipcRenderer.invoke("language:refresh"),

  getMode: (): Promise<AppMode> => ipcRenderer.invoke("mode:get"),

  setMode: (demo: boolean): Promise<{ ok: boolean }> => ipcRenderer.invoke("mode:set", demo),

  loadState: (): Promise<AppState> => ipcRenderer.invoke("state:load"),

  saveState: (state: AppState): Promise<void> => ipcRenderer.invoke("state:save", state),

  updateTrayStatus: (label?: string): Promise<void> =>
    ipcRenderer.invoke("tray:updateStatus", label),

  setMiniMode: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke("window:setMiniMode", enabled),

  getReminderSettings: (): Promise<ReminderSettings> =>
    ipcRenderer.invoke("reminder:getSettings"),

  setReminderSettings: (settings: ReminderSettings): Promise<void> =>
    ipcRenderer.invoke("reminder:setSettings", settings),

  getUpdateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke("updater:getStatus"),

  checkForUpdates: (): Promise<void> => ipcRenderer.invoke("updater:check"),

  downloadUpdate: (): Promise<void> => ipcRenderer.invoke("updater:download"),

  installUpdate: (): Promise<void> => ipcRenderer.invoke("updater:install"),

  /** Suscribe a los cambios de estado de la actualización; devuelve la función para cancelar. */
  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_e: unknown, status: UpdateStatus) => callback(status);
    ipcRenderer.on("updater:status", listener);
    return () => ipcRenderer.removeListener("updater:status", listener);
  },

  getAutoLaunch: (): Promise<AutoLaunchSettings> => ipcRenderer.invoke("autoLaunch:get"),

  setAutoLaunch: (enabled: boolean): Promise<AutoLaunchSettings> =>
    ipcRenderer.invoke("autoLaunch:set", enabled),
};

contextBridge.exposeInMainWorld("itm", api);

export type ItmBridge = typeof api;
