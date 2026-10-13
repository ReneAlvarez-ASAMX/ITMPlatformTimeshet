import { t } from "./i18n";
import * as appLog from "./appLog";
import type {
  LoginResponse,
  SubmitTimeEntriesRequest,
  SubmitTimeEntriesResponse,
  TimesheetResponse,
} from "./types";

class ItmApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ItmApiError";
    this.status = status;
  }
}

function baseUrl(host: string, company: string): string {
  return `${host}/${encodeURIComponent(company)}`;
}

async function parseJsonOrThrow(res: Response, context: string): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ItmApiError(
      t("api.unexpected", { context, detail: text.slice(0, 200) }),
      res.status
    );
  }
  if (!res.ok) {
    const message =
      data?.Result || data?.ResultStatus || data?.message || `Error HTTP ${res.status}`;
    throw new ItmApiError(`${context}: ${message}`, res.status);
  }
  return data;
}

export async function login(
  host: string,
  company: string,
  apiKey: string
): Promise<LoginResponse> {
  const url = `${baseUrl(host, company)}/login/${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await parseJsonOrThrow(res, t("api.ctx.login"));
  if (!data?.Token) {
    throw new ItmApiError(t("api.noToken"));
  }
  return data as LoginResponse;
}

export async function getTimesheet(
  host: string,
  company: string,
  token: string,
  startDate: string,
  endDate: string
): Promise<TimesheetResponse> {
  const url = new URL(`${baseUrl(host, company)}/timehours/`);
  url.searchParams.set("StartDate", startDate);
  url.searchParams.set("EndDate", endDate);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json", Token: token },
  });
  const data = await parseJsonOrThrow(res, t("api.ctx.timesheet"));
  normalizeUserComments(data);
  return data as TimesheetResponse;
}

const NEWLINE = String.fromCharCode(13, 10);

/** Texto de una nota que la API devuelve con una forma distinta a la documentada (lista, objeto, número…). */
function commentToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(commentToText).filter(Boolean).join(NEWLINE);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["UserComments", "UserComment", "Comments", "Comment", "Text", "Message", "Description"]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * La interfaz da por hecho que UserComments es texto (o null). Si ITM Platform devuelve otra cosa
 * (p. ej. tras un envío con nota), se convierte a texto y se anota la forma original en el registro.
 */
function normalizeUserComments(data: any): void {
  let reported = false;
  for (const project of data?.TimeReports ?? []) {
    for (const wi of project?.WorkItems ?? []) {
      for (const entry of wi?.TimeEntries ?? []) {
        const raw = entry?.UserComments;
        if (raw === null || raw === undefined || typeof raw === "string") continue;
        if (!reported) {
          appLog.warn("api", "UserComments con formato inesperado; se convierte a texto", {
            tipo: Array.isArray(raw) ? "array" : typeof raw,
            muestra: JSON.stringify(raw).slice(0, 500),
          });
          reported = true;
        }
        entry.UserComments = commentToText(raw);
      }
    }
  }
}

export async function submitTimeEntries(
  host: string,
  company: string,
  token: string,
  payload: SubmitTimeEntriesRequest
): Promise<SubmitTimeEntriesResponse> {
  const url = `${baseUrl(host, company)}/timehours/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Token: token,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow(res, t("api.ctx.submit"));
  return data as SubmitTimeEntriesResponse;
}

/**
 * Idioma que el usuario tiene definido en "Mi perfil" de ITM Platform (campo DefaultLanguage de su
 * ficha de usuario en la API v2: "Spanish", "English" o "Portuguese"). Devuelve null si no viene.
 */
export async function getUserLanguage(
  host: string,
  company: string,
  token: string,
  userId: string
): Promise<string | null> {
  const url = `${host}/v2/${encodeURIComponent(company)}/users/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", Token: token },
  });
  const data = await parseJsonOrThrow(res, t("api.ctx.language"));
  return typeof data?.DefaultLanguage === "string" ? data.DefaultLanguage : null;
}

export { ItmApiError };
