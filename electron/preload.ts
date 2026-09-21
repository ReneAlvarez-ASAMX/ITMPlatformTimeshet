import { contextBridge, ipcRenderer } from "electron";
import type {
  AppState,
  AutoLaunchSettings,
  Credentials,
  LoginResponse,
  ReminderSettings,
  SubmitTimeEntriesRequest,
  SubmitTimeEntriesResponse,
  TimesheetResponse,
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

  getAutoLaunch: (): Promise<AutoLaunchSettings> => ipcRenderer.invoke("autoLaunch:get"),

  setAutoLaunch: (enabled: boolean): Promise<AutoLaunchSettings> =>
    ipcRenderer.invoke("autoLaunch:set", enabled),
};

contextBridge.exposeInMainWorld("itm", api);

export type ItmBridge = typeof api;
