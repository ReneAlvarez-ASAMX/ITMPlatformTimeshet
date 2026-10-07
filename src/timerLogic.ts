import type { TimerRecord } from "../electron/types";

// Lógica pura de los registros de tiempo pendiente (sin React) para poder probarla de forma aislada.
// Regla: cada tarea tiene UN solo registro y este pertenece a UNA sola fecha. Esa fecha es la que se
// envía a ITM Platform, así que siempre debe ser la del día en el que se capturó el tiempo.

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
    ...init,
  };
}

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
    ? { ...existing, running: true, startedAt: now, date }
    : newRecord(task, date, { running: true, startedAt: now });
  return { ok: true, record };
}

/** Añade tiempo capturado a mano a la fecha `date`. */
export function planManualAdd(
  existing: TimerRecord | undefined,
  task: TaskInfo,
  seconds: number,
  date: string,
  now: number
): PlanResult {
  if (seconds <= 0) return { ok: false, reason: "invalid" };
  const blocked = pendingOnOtherDate(existing, date, now);
  if (blocked) return { ok: false, reason: "stale-date", ...blocked };
  // Se fija `date`: antes se conservaba la fecha antigua de un registro ya vaciado y las horas
  // se enviaban a ITM Platform en un día equivocado.
  const record = existing
    ? { ...existing, date, accumulatedSeconds: existing.accumulatedSeconds + seconds }
    : newRecord(task, date, { accumulatedSeconds: seconds });
  return { ok: true, record };
}
