import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  SendAuditItem,
  SendLogEntry,
  SendLogStatus,
  SubmitTimeEntriesResponse,
} from "./types";

// Registro local (CSV) de todo lo que la app envía a ITM Platform, pensado para reconciliar.
// - Se escribe ANTES de enviar (si no se puede guardar, no se envía) y se completa con el resultado.
// - Una fila por tarea y fecha en cada paso; el informe las une y marca como "sin confirmar" las que
//   quedaron iniciadas sin respuesta (p. ej. si la app se cerró a mitad de envío).
// - Solo se conservan los últimos RETENTION_MONTHS meses.

export const RETENTION_MONTHS = 2;
const SEP = ";"; // el Excel en español separa por punto y coma
const BOM = "﻿"; // para que Excel abra el archivo en UTF-8 con las tildes bien
const NEWLINE = "\r\n";

export const HEADER = [
  "enviado_el",
  "lote",
  "estado",
  "proyecto",
  "id_proyecto",
  "tarea",
  "id_tarea",
  "fecha_captura",
  "horas_existentes",
  "horas_sumadas",
  "horas_enviadas",
  "minutos_sumados",
  "nota",
  "mensaje",
];

export type RawStatus = "ENVIANDO" | "OK" | "ERROR";

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD HH:MM:SS" en hora local. Ordenable como texto. */
export function formatLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export function minutesToHHMM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
}

function hhmmToMinutes(text: string): number {
  const match = /^(\d+):(\d{1,2})$/.exec(text.trim());
  return match ? parseInt(match[1], 10) * 60 + parseInt(match[2], 10) : 0;
}

function escapeField(value: string | number): string {
  const s = String(value);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toLine(fields: (string | number)[]): string {
  return fields.map(escapeField).join(SEP) + NEWLINE;
}

/** Lee texto CSV (separador ';', comillas dobles, saltos de línea dentro de campos) en filas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === SEP) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Las escrituras se encolan: dos envíos seguidos nunca se pisan.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

/** Filas de un paso del envío (antes de enviar o con el resultado de cada tarea). */
export function buildRows(
  batchId: string,
  sentAt: Date,
  status: RawStatus,
  items: SendAuditItem[],
  messages: Record<number, string> = {},
  failed: Set<number> = new Set()
): string[][] {
  return items.map((item) => {
    const itemStatus: RawStatus = status === "ENVIANDO" ? "ENVIANDO" : failed.has(item.workItemId) ? "ERROR" : status;
    return [
      formatLocal(sentAt),
      batchId,
      itemStatus,
      item.projectName,
      String(item.entityId),
      item.taskName,
      String(item.workItemId),
      item.date,
      minutesToHHMM(item.existingMinutes),
      minutesToHHMM(item.addedMinutes),
      minutesToHHMM(item.sentMinutes),
      String(item.addedMinutes),
      item.comment,
      messages[item.workItemId] ?? "",
    ];
  });
}

export function appendRows(file: string, rows: string[][]): Promise<void> {
  return enqueue(async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    let exists = true;
    try {
      await fs.access(file);
    } catch {
      exists = false;
    }
    const body = rows.map((r) => toLine(r)).join("");
    await fs.appendFile(file, exists ? body : BOM + toLine(HEADER) + body, "utf-8");
  });
}

async function readRows(file: string): Promise<string[][]> {
  try {
    const text = await fs.readFile(file, "utf-8");
    return parseCsv(text).slice(1); // sin la cabecera
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

/** Une los pasos de cada envío (por lote, tarea y fecha): el último estado manda. */
export function mergeRows(rows: string[][]): SendLogEntry[] {
  const byKey = new Map<string, SendLogEntry>();
  for (const r of rows) {
    if (r.length < 14) continue;
    const [sentAt, batchId, status, project, projectId, task, taskId, workDate, existing, added, sent, , note, message] = r;
    const key = `${batchId}|${taskId}|${workDate}`;
    const finalStatus: SendLogStatus = status === "OK" ? "OK" : status === "ERROR" ? "ERROR" : "UNCONFIRMED";
    const previous = byKey.get(key);
    byKey.set(key, {
      batchId,
      sentAt,
      status: finalStatus,
      projectName: project,
      projectId: Number(projectId),
      taskName: task,
      taskId: Number(taskId),
      workDate,
      existingMinutes: hhmmToMinutes(existing),
      addedMinutes: hhmmToMinutes(added),
      sentMinutes: hhmmToMinutes(sent),
      note,
      message: message || previous?.message || "",
    });
  }
  return [...byKey.values()].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export async function readEntries(file: string): Promise<SendLogEntry[]> {
  return mergeRows(await readRows(file));
}

/** Elimina las filas más antiguas que la retención. Devuelve cuántas se eliminaron. */
export function purgeOld(file: string, now: Date = new Date()): Promise<number> {
  return enqueue(async () => {
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - RETENTION_MONTHS);
    const cutoff = formatLocal(cutoffDate);
    const rows = await readRows(file);
    const kept = rows.filter((r) => r[0] >= cutoff);
    const removed = rows.length - kept.length;
    if (removed === 0) return 0;
    // Reescritura atómica: archivo temporal y renombrado.
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, BOM + toLine(HEADER) + kept.map((r) => toLine(r)).join(""), "utf-8");
    await fs.rename(tmp, file);
    return removed;
  });
}

export interface LoggedSendOptions {
  file: string;
  audit: SendAuditItem[];
  /** Hace el envío real a ITM Platform. */
  send: () => Promise<SubmitTimeEntriesResponse>;
  /** Crea el error que se muestra si no se puede guardar el registro previo. */
  writeError: (detail: string) => Error;
  now?: Date;
  batchId?: string;
}

/**
 * Envía dejando constancia en el CSV:
 *  1. registra TODO antes de enviar (si no se puede guardar, no se llama a `send`);
 *  2. envía;
 *  3. registra el resultado de cada tarea (o el error si el envío falla).
 * Si la app se cierra entre el paso 1 y el 3, las filas quedan "sin confirmar".
 */
export async function sendWithLog(opts: LoggedSendOptions): Promise<SubmitTimeEntriesResponse> {
  const { file, audit, send } = opts;
  const sentAt = opts.now ?? new Date();
  const batchId = opts.batchId ?? Math.random().toString(16).slice(2, 10);

  try {
    await purgeOld(file, sentAt);
    await appendRows(file, buildRows(batchId, sentAt, "ENVIANDO", audit));
  } catch (err: any) {
    throw opts.writeError(err?.message ?? String(err));
  }

  let res: SubmitTimeEntriesResponse;
  try {
    res = await send();
  } catch (err: any) {
    const message = err?.message ?? String(err);
    const all = Object.fromEntries(audit.map((a) => [a.workItemId, message]));
    await appendRows(file, buildRows(batchId, sentAt, "ERROR", audit, all)).catch((e) =>
      console.warn("[sendLog] resultado:", e)
    );
    throw err;
  }

  // Mismo criterio que la interfaz para dar una tarea por enviada o fallida.
  const messages: Record<number, string> = {};
  const failed = new Set<number>();
  for (const e of res.Errors ?? []) {
    failed.add(e.WorkItemId);
    messages[e.WorkItemId] = e.Message;
  }
  if (res.StatusCode >= 400 && failed.size === 0) {
    for (const a of audit) {
      failed.add(a.workItemId);
      messages[a.workItemId] = res.StatusMessage;
    }
  }
  for (const a of audit) if (!failed.has(a.workItemId)) messages[a.workItemId] = res.StatusMessage ?? "";
  await appendRows(file, buildRows(batchId, sentAt, "OK", audit, messages, failed)).catch((e) =>
    console.warn("[sendLog] resultado:", e)
  );
  return res;
}
