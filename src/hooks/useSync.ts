import { useCallback, useRef, useState } from "react";
import type { SendAuditItem, TimeReportSubmitEntry, TimerRecord } from "../../electron/types";
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

export function useSync() {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  const submit = useCallback(
    async (
      pending: PendingItem[],
      onSynced: (workItemIds: number[]) => void
    ): Promise<{ successCount: number; failureCount: number }> => {
      if (pending.length === 0) return { successCount: 0, failureCount: 0 };
      setSyncing(true);
      setLastError(null);
      setItemErrors({});
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
          dateErrors[p.workItemId] = tRef.current("review.dateError", { date: p.date, detail });
          return false;
        });
        if (sendable.length === 0) {
          setItemErrors(dateErrors);
          setLastError(tRef.current("review.nothingSendable"));
          return { successCount: 0, failureCount: pending.length };
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

        // Mismo criterio que el registro de envíos: un error general sin detalle por tarea
        // significa que NINGUNA se envió (antes se daban por enviadas y se borraba el pendiente).
        const { failed, okIds: successIds } = classifyResponse(
          res,
          sendable.map((p) => p.workItemId)
        );
        const errMap: Record<number, string> = { ...dateErrors };
        failed.forEach((message, id) => {
          errMap[id] = message;
        });
        if (Object.keys(errMap).length > 0) setItemErrors(errMap);

        if (successIds.length > 0) onSynced(successIds);

        if (res.StatusCode >= 400 && successIds.length === 0) {
          setLastError(res.StatusMessage || tRef.current("sync.error.send"));
        }

        return {
          successCount: successIds.length,
          failureCount: Object.keys(errMap).length,
        };
      } catch (err: any) {
        setLastError(err?.message ?? tRef.current("sync.error.generic"));
        return { successCount: 0, failureCount: pending.length };
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  return { syncing, lastError, itemErrors, submit };
}
