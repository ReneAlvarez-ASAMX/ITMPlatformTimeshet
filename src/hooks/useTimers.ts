import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, TimerRecord } from "../../electron/types";
import { emptyAppState } from "../../electron/types";
import { useI18n } from "../i18n";
import { formatShort, todayStr } from "../timeFormat";

export interface TaskRef {
  workItemId: number;
  entityId: number;
  taskName: string;
  projectName: string;
}

export function useTimers() {
  const { t } = useI18n();
  const [state, setState] = useState<AppState>(emptyAppState());
  const [loaded, setLoaded] = useState(false);
  const [, forceTick] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    window.itm.loadState().then((s) => {
      setState(s);
      setLoaded(true);
    });
  }, []);

  // Re-render cada segundo para reflejar el avance de los cronómetros activos.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const persist = useCallback((patch: Partial<AppState>) => {
    const next = { ...stateRef.current, ...patch };
    setState(next);
    window.itm.saveState(next);
  }, []);

  // Guardado periódico de seguridad mientras haya cronómetros corriendo,
  // para poder recuperar el tiempo transcurrido si la app se cierra abruptamente.
  useEffect(() => {
    const id = setInterval(() => {
      const hasRunning = Object.values(stateRef.current.timers).some((t) => t.running);
      if (hasRunning) window.itm.saveState(stateRef.current);
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const getElapsedSeconds = useCallback(
    (workItemId: number): number => {
      const rec = state.timers[String(workItemId)];
      if (!rec) return 0;
      const live = rec.running && rec.startedAt ? (Date.now() - rec.startedAt) / 1000 : 0;
      return rec.accumulatedSeconds + live;
    },
    [state]
  );

  /** Inicia el cronómetro en vivo para una tarea, imputado al día indicado (normalmente hoy). */
  const start = useCallback(
    (task: TaskRef, date: string) => {
      const key = String(task.workItemId);
      const existing = stateRef.current.timers[key];
      if (existing && existing.accumulatedSeconds > 0 && existing.date !== date) {
        return {
          ok: false as const,
          reason: "stale-date" as const,
          pendingDate: existing.date,
          pendingSeconds: existing.accumulatedSeconds,
        };
      }
      const record: TimerRecord = existing
        ? { ...existing, running: true, startedAt: Date.now(), date }
        : {
            workItemId: task.workItemId,
            entityId: task.entityId,
            taskName: task.taskName,
            projectName: task.projectName,
            date,
            startedAt: Date.now(),
            accumulatedSeconds: 0,
            running: true,
            comment: "",
          };
      persist({ timers: { ...stateRef.current.timers, [key]: record } });
      return { ok: true as const };
    },
    [persist]
  );

  /** Añade tiempo capturado manualmente (sin usar el cronómetro) al acumulado pendiente del día indicado. */
  const addManualSeconds = useCallback(
    (task: TaskRef, seconds: number, date: string) => {
      if (seconds <= 0) return { ok: false as const, reason: "invalid" as const };
      const key = String(task.workItemId);
      const existing = stateRef.current.timers[key];
      if (existing && existing.accumulatedSeconds > 0 && existing.date !== date && !existing.running) {
        return {
          ok: false as const,
          reason: "stale-date" as const,
          pendingDate: existing.date,
          pendingSeconds: existing.accumulatedSeconds,
        };
      }
      const record: TimerRecord = existing
        ? { ...existing, accumulatedSeconds: existing.accumulatedSeconds + seconds }
        : {
            workItemId: task.workItemId,
            entityId: task.entityId,
            taskName: task.taskName,
            projectName: task.projectName,
            date,
            startedAt: null,
            accumulatedSeconds: seconds,
            running: false,
            comment: "",
          };
      persist({ timers: { ...stateRef.current.timers, [key]: record } });
      return { ok: true as const };
    },
    [persist]
  );

  /** Corrige la hora de inicio de un cronómetro en marcha (p. ej. si se olvidó iniciarlo a tiempo). */
  const adjustStartTime = useCallback(
    (workItemId: number, newStartedAt: number) => {
      const key = String(workItemId);
      const existing = stateRef.current.timers[key];
      if (!existing || !existing.running || !existing.startedAt) {
        return { ok: false as const };
      }
      const clamped = Math.min(newStartedAt, Date.now());
      persist({ timers: { ...stateRef.current.timers, [key]: { ...existing, startedAt: clamped } } });
      return { ok: true as const };
    },
    [persist]
  );

  /** Corrige (reemplaza, no suma) el tiempo pendiente de una tarea ya detenida — para arreglar errores. */
  const setAccumulatedSeconds = useCallback(
    (workItemId: number, seconds: number) => {
      const key = String(workItemId);
      const existing = stateRef.current.timers[key];
      if (!existing) return { ok: false as const };
      const clamped = Math.max(0, seconds);
      persist({
        timers: { ...stateRef.current.timers, [key]: { ...existing, accumulatedSeconds: clamped } },
      });
      return { ok: true as const };
    },
    [persist]
  );

  const setComment = useCallback(
    (workItemId: number, comment: string) => {
      const key = String(workItemId);
      const existing = stateRef.current.timers[key];
      if (!existing) return;
      persist({ timers: { ...stateRef.current.timers, [key]: { ...existing, comment } } });
    },
    [persist]
  );

  const pause = useCallback(
    (workItemId: number) => {
      const key = String(workItemId);
      const existing = stateRef.current.timers[key];
      if (!existing || !existing.running) return;
      const elapsed = existing.startedAt ? (Date.now() - existing.startedAt) / 1000 : 0;
      const record: TimerRecord = {
        ...existing,
        running: false,
        startedAt: null,
        accumulatedSeconds: existing.accumulatedSeconds + elapsed,
      };
      persist({ timers: { ...stateRef.current.timers, [key]: record } });
    },
    [persist]
  );

  const discard = useCallback(
    (workItemId: number) => {
      const key = String(workItemId);
      const next = { ...stateRef.current.timers };
      delete next[key];
      persist({ timers: next });
    },
    [persist]
  );

  const isFavorite = useCallback(
    (workItemId: number): boolean => Boolean(state.favorites[String(workItemId)]),
    [state.favorites]
  );

  const toggleFavorite = useCallback(
    (workItemId: number) => {
      const key = String(workItemId);
      const next = { ...stateRef.current.favorites };
      if (next[key]) delete next[key];
      else next[key] = true;
      persist({ favorites: next });
    },
    [persist]
  );

  /** Reemplaza por completo la lista de tareas destacadas (p. ej. la selección diaria). */
  const replaceFavorites = useCallback(
    (workItemIds: number[]) => {
      const next: Record<string, boolean> = {};
      for (const id of workItemIds) next[String(id)] = true;
      persist({ favorites: next });
    },
    [persist]
  );

  /** Tras sincronizar con éxito, deja el acumulado local en cero (conservando si sigue corriendo). */
  const markSynced = useCallback(
    (workItemIds: number[]) => {
      const next = { ...stateRef.current.timers };
      for (const id of workItemIds) {
        const key = String(id);
        const existing = next[key];
        if (!existing) continue;
        next[key] = {
          ...existing,
          accumulatedSeconds: 0,
          comment: "",
          startedAt: existing.running ? Date.now() : null,
        };
      }
      persist({ timers: next });
    },
    [persist]
  );

  useEffect(() => {
    const running = Object.values(state.timers).filter((t) => t.running);
    if (running.length === 0) {
      window.itm.updateTrayStatus(undefined);
      return;
    }
    const totalToday = Object.values(state.timers)
      .filter((t) => t.date === todayStr())
      .reduce((sum, t) => sum + getElapsedSeconds(t.workItemId), 0);
    window.itm.updateTrayStatus(
      t("tray.status", { count: running.length, time: formatShort(totalToday) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, t]);

  return {
    timers: state.timers,
    loaded,
    start,
    pause,
    discard,
    markSynced,
    getElapsedSeconds,
    addManualSeconds,
    setAccumulatedSeconds,
    setComment,
    adjustStartTime,
    favorites: state.favorites,
    isFavorite,
    toggleFavorite,
    replaceFavorites,
  };
}
