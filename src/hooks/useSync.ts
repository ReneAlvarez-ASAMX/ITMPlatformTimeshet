import { useCallback, useRef, useState } from "react";
import type { SendAuditItem, TimeReportSubmitEntry, TimerRecord } from "../../electron/types";
import type { MessageKey } from "../../electron/i18n";
import { classifyResponse } from "../../electron/sendResult";
import { fetchExistingPerDate } from "../existingHours";
import type { ExistingHours } from "../existingHours";
import { useI18n } from "../i18n";
import { composeNote, mergeComments } from "../timerLogic";
import { hhmmToSeconds, secondsToHHMM } from "../timeFormat";

const MIN_SYNCABLE_SECONDS = 30;

export interface PendingItem {
  workItemId: number;
  entityId: number;
  taskName: string;
  projectName: string;
  date: string;
  seconds: number;
  /** Borrador de la nota del tramo en curso (editable). */
  draft: string;
  /** Nota completa de este envío: tramos cerrados + borrador, una por línea con su tiempo parcial. */
  note: string;
}

/** Consulta a ITM Platform lo ya reportado en cada una de las fechas indicadas (fecha por fecha). */
export function fetchExisting(dates: string[]): Promise<ExistingHours> {
  return fetchExistingPerDate(dates, (date) => window.itm.getTimesheet(date, date));
}

export function collectPending(
  timers: Record<string, TimerRecord>,
  getElapsedSeconds: (workItemId: number) => number,
  now: number = Date.now()
): PendingItem[] {
  return Object.values(timers)
    .map((t) => ({
      workItemId: t.workItemId,
      entityId: t.entityId,
      taskName: t.taskName,
      projectName: t.projectName,
      date: t.date,
      seconds: getElapsedSeconds(t.workItemId),
      draft: t.comment ?? "",
      note: composeNote(t, now),
    }))
    .filter((t) => t.seconds >= MIN_SYNCABLE_SECONDS)
    .sort((a, b) => a.date.localeCompare(b.date) || a.taskName.localeCompare(b.taskName));
}

/** Lo que se dio por enviado de cada tarea: los segundos que hay que restar de su pendiente. */
export interface SyncedItem {
  workItemId: number;
  seconds: number;
}

export interface SyncOutcome {
  synced: SyncedItem[];
  itemErrors: Record<number, string>;
  lastError: string | null;
  failureCount: number;
}

type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

/**
 * Envía a ITM Platform lo pendiente. `getPending` se llama al empezar el envío para usar el tiempo
 * vivo de ese momento (no el del último renderizado). Devuelve los segundos enviados de cada tarea:
 * quien lo llama los RESTA del pendiente, así lo transcurrido durante el envío no se pierde.
 */
export async function sendPending(getPending: () => PendingItem[], t: Translate): Promise<SyncOutcome> {
  const pending = getPending();
  if (pending.length === 0) return { synced: [], itemErrors: {}, lastError: null, failureCount: 0 };
  try {
    // Lo ya reportado, fecha por fecha: una fecha que no se pueda consultar no bloquea las demás.
    const { existing: existingByKey, comments: existingComments, failed: failedDates } = await fetchExisting(
      pending.map((p) => p.date)
    );

    const dateErrors: Record<number, string> = {};
    const sendable = pending.filter((p) => {
      const detail = failedDates.get(p.date);
      if (detail === undefined) return true;
      // Sin saber lo que ya hay en ITM Platform se sobrescribiría: esta tarea no se envía.
      dateErrors[p.workItemId] = t("review.dateError", { date: p.date, detail });
      return false;
    });
    if (sendable.length === 0) {
      return {
        synced: [],
        itemErrors: dateErrors,
        lastError: t("review.nothingSendable"),
        failureCount: pending.length,
      };
    }

    const entries: TimeReportSubmitEntry[] = [];
    // Datos para el registro local de envíos (CSV): qué había, qué se suma y qué se envía.
    const audit: SendAuditItem[] = [];
    for (const p of sendable) {
      const existingSeconds = existingByKey.get(`${p.workItemId}_${p.date}`) ?? 0;
      const reportedHours = secondsToHHMM(existingSeconds + p.seconds);
      // Se AÑADE a la nota que ITM ya tiene ese día; nunca se reemplaza.
      const comment = mergeComments(existingComments.get(`${p.workItemId}_${p.date}`), p.note);
      entries.push({
        EntityId: p.entityId,
        WorkItemId: p.workItemId,
        Date: p.date,
        ReportedHours: reportedHours,
        ...(comment ? { UserComment: comment } : {}),
      });
      audit.push({
        workItemId: p.workItemId,
        entityId: p.entityId,
        projectName: p.projectName,
        taskName: p.taskName,
        date: p.date,
        existingMinutes: Math.round(existingSeconds / 60),
        addedMinutes: Math.round(p.seconds / 60),
        sentMinutes: Math.round(hhmmToSeconds(reportedHours) / 60),
        comment,
      });
    }

    const res = await window.itm.submitTimeEntries({ TimeReports: entries }, audit);

    // Mismo criterio que el registro de envíos. Con un error general (>= 400) ITM Platform rechaza el
    // lote entero: ninguna tarea se da por enviada sin comprobarlo.
    const { failed, okIds, rejected } = classifyResponse(
      res,
      sendable.map((p) => p.workItemId)
    );
    const listed = new Set((res.Errors ?? []).map((e) => e.WorkItemId));
    const okSet = new Set(okIds);
    if (rejected) {
      for (const id of await confirmedOnServer(entries, listed)) okSet.add(id);
    }

    const errMap: Record<number, string> = { ...dateErrors };
    failed.forEach((message, id) => {
      if (okSet.has(id)) return;
      // Las que no tenían error propio no se guardaron por culpa de otras del mismo envío.
      errMap[id] = rejected && !listed.has(id) ? t("sync.error.batchRejected") : message;
    });

    const synced = sendable
      .filter((p) => okSet.has(p.workItemId))
      .map((p) => ({ workItemId: p.workItemId, seconds: p.seconds }));
    return {
      synced,
      itemErrors: errMap,
      lastError: res.StatusCode >= 400 ? res.StatusMessage || t("sync.error.send") : null,
      failureCount: Object.keys(errMap).length,
    };
  } catch (err: any) {
    return {
      synced: [],
      itemErrors: {},
      lastError: err?.message ?? t("sync.error.generic"),
      failureCount: pending.length,
    };
  }
}

/**
 * Tras un rechazo del lote, relee las horas del servidor y devuelve las tareas (de las no listadas en
 * `Errors`) cuyo valor en ITM Platform coincide con el enviado. Si una fecha no se puede releer, sus
 * tareas no se confirman.
 */
async function confirmedOnServer(entries: TimeReportSubmitEntry[], ownErrors: Set<number>): Promise<number[]> {
  const candidates = entries.filter((e) => !ownErrors.has(e.WorkItemId));
  if (candidates.length === 0) return [];
  const { existing, failed: unreadable } = await fetchExisting(candidates.map((e) => e.Date));
  return candidates
    .filter((e) => !unreadable.has(e.Date))
    .filter((e) => existing.get(`${e.WorkItemId}_${e.Date}`) === hhmmToSeconds(e.ReportedHours))
    .map((e) => e.WorkItemId);
}

export function useSync() {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  const submit = useCallback(
    async (
      getPending: () => PendingItem[],
      onSynced: (items: SyncedItem[]) => void
    ): Promise<{ successCount: number; failureCount: number }> => {
      setSyncing(true);
      setLastError(null);
      setItemErrors({});
      try {
        const outcome = await sendPending(getPending, (key, params) => tRef.current(key, params));
        setItemErrors(outcome.itemErrors);
        setLastError(outcome.lastError);
        if (outcome.synced.length > 0) onSynced(outcome.synced);
        return { successCount: outcome.synced.length, failureCount: outcome.failureCount };
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  return { syncing, lastError, itemErrors, submit };
}
