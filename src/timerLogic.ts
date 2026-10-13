import type { TimerRecord } from "../electron/types";
import { formatShort } from "./timeFormat";

// Lógica pura de los registros de tiempo pendiente (sin React) para poder probarla de forma aislada.
//
// Reglas de fechas: cada tarea tiene UN solo registro y este pertenece a UNA sola fecha. Esa fecha es la
// que se envía a ITM Platform, así que siempre debe ser la del día en el que se capturó el tiempo.
//
// Reglas de notas: el registro guarda "tramos" (cada vez que se pausa el temporizador o se añade tiempo a
// mano se cierra un tramo con su tiempo y su nota). Al enviar, las notas se juntan una por línea con el
// tiempo parcial de cada una, p. ej. "Revisión de APR (1h 30m)", y se AÑADEN a la nota que ITM Platform
// ya tenga ese día en lugar de reemplazarla.

/** Separador de líneas dentro de una nota: CRLF, para que Power BI y otros informes lo muestren como líneas distintas. */
export const NOTE_SEPARATOR = "\r\n";

export interface TaskInfo {
  workItemId: number;
  entityId: number;
  taskName: string;
  projectName: string;
}

export type PlanResult =
  | { ok: true; record: TimerRecord }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "stale-date"; pendingDate: string; pendingSeconds: number };

/** Segundos de un registro, incluido el tramo en vivo si el temporizador está en marcha. */
function elapsed(record: TimerRecord, now: number): number {
  const live = record.running && record.startedAt ? (now - record.startedAt) / 1000 : 0;
  return record.accumulatedSeconds + live;
}

/** ¿El registro tiene tiempo (acumulado o en marcha) que pertenece a una fecha distinta de `date`? */
function pendingOnOtherDate(existing: TimerRecord | undefined, date: string, now: number) {
  if (!existing || existing.date === date) return null;
  const seconds = elapsed(existing, now);
  if (seconds <= 0 && !existing.running) return null;
  return { pendingDate: existing.date, pendingSeconds: seconds };
}

function newRecord(task: TaskInfo, date: string, init: Partial<TimerRecord>): TimerRecord {
  return {
    workItemId: task.workItemId,
    entityId: task.entityId,
    taskName: task.taskName,
    projectName: task.projectName,
    date,
    startedAt: null,
    accumulatedSeconds: 0,
    running: false,
    comment: "",
    segments: [],
    ...init,
  };
}

// ---------------------------------------------------------------- notas

/** Normaliza los saltos de línea de una nota a CRLF. */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n|\r|\n/g, NOTE_SEPARATOR);
}

/** "nota (1h 30m)": el tiempo parcial va entre paréntesis al final de la nota. Mínimo 1 minuto. */
function withPartial(note: string, seconds: number): string {
  return `${normalizeNewlines(note.trim())} (${formatShort(Math.max(60, seconds))})`;
}

/**
 * Si el temporizador está parado, hay una nota en el borrador y el último tramo no tiene nota,
 * el borrador pasa a ser la nota de ese tramo (con su tiempo). Permite escribir la nota después de pausar.
 */
export function foldDraft(record: TimerRecord): TimerRecord {
  const draft = record.comment.trim();
  const segments = record.segments ?? [];
  if (record.running || !draft || segments.length === 0) return record;
  const last = segments[segments.length - 1];
  if (last.note.trim()) return record;
  return {
    ...record,
    comment: "",
    segments: [...segments.slice(0, -1), { ...last, note: draft }],
  };
}

/** Notas ya cerradas (de tramos anteriores), una por línea con su tiempo parcial. Solo lectura. */
export function previousNotes(record: TimerRecord | undefined): string {
  if (!record) return "";
  return (foldDraft(record).segments ?? [])
    .filter((s) => s.note.trim())
    .map((s) => withPartial(s.note, s.seconds))
    .join(NOTE_SEPARATOR);
}

/**
 * Nota completa que se enviará por este registro: los tramos cerrados más el borrador actual.
 * Si el temporizador está en marcha, el borrador lleva el tiempo transcurrido desde que arrancó.
 */
export function composeNote(record: TimerRecord, now: number): string {
  const folded = foldDraft(record);
  const lines = (folded.segments ?? [])
    .filter((s) => s.note.trim())
    .map((s) => withPartial(s.note, s.seconds));
  const draft = folded.comment.trim();
  if (draft) {
    lines.push(
      folded.running && folded.startedAt
        ? withPartial(draft, (now - folded.startedAt) / 1000)
        : normalizeNewlines(draft) // sin tiempo parcial conocido
    );
  }
  return lines.join(NOTE_SEPARATOR);
}

/**
 * Une la nota que ITM Platform ya tiene para ese día con la nueva, sin reemplazar nada:
 * la nueva se añade en una línea aparte. Devuelve "" si no hay nada nuevo que enviar.
 */
export function mergeComments(existing: string | null | undefined, added: string): string {
  const next = added.trim();
  if (!next) return "";
  const prev = (existing ?? "").trim();
  if (!prev) return next;
  if (prev.includes(next)) return prev; // ya estaba (p. ej. un reenvío)
  return `${prev}${NOTE_SEPARATOR}${next}`;
}

// ---------------------------------------------------------------- acciones

/** Inicia el cronómetro de una tarea imputado a `date`. */
export function planStart(
  existing: TimerRecord | undefined,
  task: TaskInfo,
  date: string,
  now: number
): PlanResult {
  const blocked = pendingOnOtherDate(existing, date, now);
  if (blocked) return { ok: false, reason: "stale-date", ...blocked };
  // `date` se fija siempre: un registro sin tiempo pendiente conserva la fecha de su último uso.
  const record = existing
    ? { ...foldDraft(existing), running: true, startedAt: now, date }
    : newRecord(task, date, { running: true, startedAt: now });
  return { ok: true, record };
}

/** Pausa el cronómetro: cierra el tramo con su tiempo y la nota escrita durante él. */
export function planPause(existing: TimerRecord | undefined, now: number): TimerRecord | null {
  if (!existing || !existing.running) return null;
  const seconds = existing.startedAt ? Math.max(0, (now - existing.startedAt) / 1000) : 0;
  const note = existing.comment.trim();
  return {
    ...existing,
    running: false,
    startedAt: null,
    accumulatedSeconds: existing.accumulatedSeconds + seconds,
    comment: "",
    segments: seconds > 0 || note ? [...(existing.segments ?? []), { seconds, note }] : existing.segments ?? [],
  };
}

/** Añade tiempo capturado a mano a la fecha `date`, con su propia nota opcional. */
export function planManualAdd(
  existing: TimerRecord | undefined,
  task: TaskInfo,
  seconds: number,
  date: string,
  now: number,
  note = ""
): PlanResult {
  if (seconds <= 0) return { ok: false, reason: "invalid" };
  const blocked = pendingOnOtherDate(existing, date, now);
  if (blocked) return { ok: false, reason: "stale-date", ...blocked };
  const segment = { seconds, note: note.trim() };
  // Se fija `date`: antes se conservaba la fecha antigua de un registro ya vaciado y las horas
  // se enviaban a ITM Platform en un día equivocado.
  const base = existing ? foldDraft(existing) : undefined;
  const record = base
    ? {
        ...base,
        date,
        accumulatedSeconds: base.accumulatedSeconds + seconds,
        segments: [...(base.segments ?? []), segment],
      }
    : newRecord(task, date, { accumulatedSeconds: seconds, segments: [segment] });
  return { ok: true, record };
}

/** Tras enviar con éxito: el pendiente y sus notas quedan a cero (si sigue en marcha, cuenta desde ahora). */
export function planMarkSynced(existing: TimerRecord, now: number): TimerRecord {
  return {
    ...existing,
    accumulatedSeconds: 0,
    comment: "",
    segments: [],
    startedAt: existing.running ? now : null,
  };
}

/** Corrige (reemplaza, no suma) el tiempo pendiente. Si queda a cero, también se descartan sus notas. */
export function planSetAccumulated(existing: TimerRecord, seconds: number): TimerRecord {
  const clamped = Math.max(0, seconds);
  return clamped === 0
    ? { ...existing, accumulatedSeconds: 0, comment: "", segments: [] }
    : { ...existing, accumulatedSeconds: clamped };
}
