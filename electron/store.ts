import { app, safeStorage } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppState, Credentials, ReminderSettings, Session } from "./types";
import { defaultReminderSettings, emptyAppState } from "./types";

function userDataDir(): string {
  return app.getPath("userData");
}

function credentialsPath(): string {
  return path.join(userDataDir(), "credentials.json");
}

function sessionPath(): string {
  return path.join(userDataDir(), "session.json");
}

function statePath(): string {
  return path.join(userDataDir(), "state.json");
}

function reminderPath(): string {
  return path.join(userDataDir(), "reminder.json");
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data), "utf-8");
}

function encrypt(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString("base64");
  }
  // Respaldo poco probable en Windows (DPAPI); evita perder el dato.
  return Buffer.from(value, "utf-8").toString("base64");
}

function decrypt(value: string): string {
  const buf = Buffer.from(value, "base64");
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(buf);
    } catch {
      // El valor pudo haberse guardado sin cifrar (respaldo); intenta leerlo tal cual.
      return buf.toString("utf-8");
    }
  }
  return buf.toString("utf-8");
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  await writeJson(credentialsPath(), {
    company: creds.company,
    apiKeyEncrypted: encrypt(creds.apiKey),
  });
}

export async function loadCredentials(): Promise<Credentials | null> {
  const data = await readJson<{ company: string; apiKeyEncrypted: string }>(
    credentialsPath()
  );
  if (!data) return null;
  return { company: data.company, apiKey: decrypt(data.apiKeyEncrypted) };
}

export async function clearCredentials(): Promise<void> {
  await fs.rm(credentialsPath(), { force: true });
}

export async function saveSession(session: Session): Promise<void> {
  await writeJson(sessionPath(), {
    userId: session.userId,
    tokenEncrypted: encrypt(session.token),
  });
}

export async function loadSession(): Promise<Session | null> {
  const data = await readJson<{ userId: string; tokenEncrypted: string }>(
    sessionPath()
  );
  if (!data) return null;
  return { userId: data.userId, token: decrypt(data.tokenEncrypted) };
}

export async function clearSession(): Promise<void> {
  await fs.rm(sessionPath(), { force: true });
}

export async function loadAppState(): Promise<AppState> {
  const data = await readJson<AppState>(statePath());
  // Combina con los valores por defecto para no romper estados guardados
  // antes de añadir un campo nuevo (p. ej. `favorites`).
  return { ...emptyAppState(), ...data };
}

export async function saveAppState(state: AppState): Promise<void> {
  await writeJson(statePath(), state);
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  const data = await readJson<Partial<ReminderSettings>>(reminderPath());
  // Combina con los valores por defecto para no romper ajustes guardados
  // antes de añadir un campo nuevo (p. ej. `activeCheckEnabled`).
  return { ...defaultReminderSettings(), ...data };
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await writeJson(reminderPath(), settings);
}
