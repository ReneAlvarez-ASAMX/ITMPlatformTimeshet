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
      `Respuesta inesperada de ITM Platform (${context}): ${text.slice(0, 200)}`,
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
  const data = await parseJsonOrThrow(res, "Login");
  if (!data?.Token) {
    throw new ItmApiError(
      "No se recibió un token de sesión válido. Verifica el company y la API Key."
    );
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
  const data = await parseJsonOrThrow(res, "Obtener timesheet");
  return data as TimesheetResponse;
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
  const data = await parseJsonOrThrow(res, "Enviar horas");
  return data as SubmitTimeEntriesResponse;
}

export { ItmApiError };
