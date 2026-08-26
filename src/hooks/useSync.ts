import { useCallback, useState } from "react";
import type { TimeReportSubmitEntry, TimerRecord } from "../../electron/types";
import { hhmmToSeconds, secondsToHHMM } from "../timeFormat";

const MIN_SYNCABLE_SECONDS = 30;

export interface PendingItem {
  workItemId: number;
  entityId: number;
  taskName: string;
  date: string;
  seconds: number;
  comment: string;
}

/** Consulta a ITM Platform las horas ya reportadas para el rango de fechas indicado. */
export async function fetchExistingSeconds(
  minDate: string,
  maxDate: string
): Promise<Map<string, number>> {
  const fresh = await window.itm.getTimesheet(minDate, maxDate);
  const existingByKey = new Map<string, number>();
  for (const project of fresh.TimeReports) {
    for (const wi of project.WorkItems) {
      for (const entry of wi.TimeEntries) {
        existingByKey.set(`${wi.WorkItemId}_${entry.Date}`, hhmmToSeconds(entry.ReportedHours));
      }
    }
  }
  return existingByKey;
}

export function collectPending(
  timers: Record<string, TimerRecord>,
  getElapsedSeconds: (workItemId: number) => number
): PendingItem[] {
  return Object.values(timers)
    .map((t) => ({
      workItemId: t.workItemId,
      entityId: t.entityId,
      taskName: t.taskName,
      date: t.date,
      seconds: getElapsedSeconds(t.workItemId),
      comment: t.comment ?? "",
    }))
    .filter((t) => t.seconds >= MIN_SYNCABLE_SECONDS);
}

export function useSync() {
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
        const dates = pending.map((p) => p.date).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];

        const existingByKey = await fetchExistingSeconds(minDate, maxDate);

        const entries: TimeReportSubmitEntry[] = pending.map((p) => {
          const existingSeconds = existingByKey.get(`${p.workItemId}_${p.date}`) ?? 0;
          const combined = existingSeconds + p.seconds;
          return {
            EntityId: p.entityId,
            WorkItemId: p.workItemId,
            Date: p.date,
            ReportedHours: secondsToHHMM(combined),
            ...(p.comment.trim() ? { UserComment: p.comment.trim() } : {}),
          };
        });

        const res = await window.itm.submitTimeEntries({ TimeReports: entries });

        const failedIds = new Set<number>();
        if (res.Errors && res.Errors.length > 0) {
          const errMap: Record<number, string> = {};
          for (const e of res.Errors) {
            failedIds.add(e.WorkItemId);
            errMap[e.WorkItemId] = e.Message;
          }
          setItemErrors(errMap);
        }

        const successIds = pending
          .map((p) => p.workItemId)
          .filter((id) => !failedIds.has(id));

        if (successIds.length > 0) onSynced(successIds);

        if (res.StatusCode >= 400 && successIds.length === 0) {
          setLastError(res.StatusMessage || "No se pudieron enviar las horas.");
        }

        return { successCount: successIds.length, failureCount: failedIds.size };
      } catch (err: any) {
        setLastError(err?.message ?? "Error al enviar las horas a ITM Platform.");
        return { successCount: 0, failureCount: pending.length };
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  return { syncing, lastError, itemErrors, submit };
}
