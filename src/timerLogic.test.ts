import { describe, expect, it } from "vitest";
import type { TimerRecord } from "../electron/types";
import {
  NOTE_SEPARATOR,
  composeNote,
  mergeComments,
  planManualAdd,
  planMarkSynced,
  planPause,
  planStart,
  type TaskInfo,
} from "./timerLogic";

const task: TaskInfo = { workItemId: 1, entityId: 10, taskName: "Tarea A", projectName: "Proyecto" };
const T0 = Date.UTC(2026, 10, 4, 9, 0, 0);
const MIN = 60_000;

describe("timerLogic", () => {
  it("iniciar y pausar acumula el tramo con su nota", () => {
    const started = planStart(undefined, task, "2026-11-04", T0);
    if (!started.ok) throw new Error("debería iniciar");
    const paused = planPause({ ...started.record, comment: "Revisión" }, T0 + 90 * MIN);
    expect(paused).toMatchObject({ running: false, startedAt: null, accumulatedSeconds: 5400, comment: "" });
    expect(paused!.segments).toEqual([{ seconds: 5400, note: "Revisión" }]);
  });

  it("no inicia sobre tiempo pendiente de otro día", () => {
    const existing = planManualAdd(undefined, task, 3600, "2026-11-03", T0);
    if (!existing.ok) throw new Error("debería añadir");
    expect(planStart(existing.record, task, "2026-11-04", T0)).toEqual({
      ok: false,
      reason: "stale-date",
      pendingDate: "2026-11-03",
      pendingSeconds: 3600,
    });
  });

  it("rechaza añadir tiempo no positivo", () => {
    expect(planManualAdd(undefined, task, 0, "2026-11-04", T0)).toEqual({ ok: false, reason: "invalid" });
  });

  it("compone la nota con el tiempo parcial de cada tramo", () => {
    const record: TimerRecord = {
      ...(planManualAdd(undefined, task, 5400, "2026-11-04", T0, "Revisión de APR") as { record: TimerRecord }).record,
      comment: "Reunión",
      running: true,
      startedAt: T0,
    };
    expect(composeNote(record, T0 + 30 * MIN)).toBe(`Revisión de APR (1h 30m)${NOTE_SEPARATOR}Reunión (30m)`);
  });

  it("añade la nota nueva sin reemplazar la existente ni duplicarla", () => {
    expect(mergeComments("", "nueva")).toBe("nueva");
    expect(mergeComments("previa", "nueva")).toBe(`previa${NOTE_SEPARATOR}nueva`);
    expect(mergeComments("previa\r\nnueva", "nueva")).toBe("previa\r\nnueva");
    expect(mergeComments("previa", "  ")).toBe("");
  });

  describe("planMarkSynced (ticket §1.1)", () => {
    const today = "2026-11-04";
    const HOUR = 60 * MIN;

    it("con el temporizador en marcha resta lo enviado y conserva el resto", () => {
      // A en marcha desde las 09:00; se envían 120 min calculados a las 11:00 y la respuesta llega a las 13:00.
      const started = planStart(undefined, task, today, T0);
      if (!started.ok) throw new Error("debería iniciar");
      const synced = planMarkSynced(started.record, 120 * 60, T0 + 4 * HOUR);
      expect(synced).toMatchObject({ running: true, startedAt: T0 + 4 * HOUR, accumulatedSeconds: 120 * 60 });
    });

    it("lo transcurrido mientras se envía sigue pendiente", () => {
      const started = planStart(undefined, task, today, T0);
      if (!started.ok) throw new Error("debería iniciar");
      // Se envían 240 min (09:00-13:00) y la respuesta llega 5 s después.
      const synced = planMarkSynced(started.record, 240 * 60, T0 + 4 * HOUR + 5000);
      expect(synced.accumulatedSeconds).toBe(5);
      expect(synced.running).toBe(true);
    });

    it("con el temporizador parado deja a cero el pendiente enviado y sus notas", () => {
      const added = planManualAdd(undefined, task, 5400, today, T0, "Revisión");
      if (!added.ok) throw new Error("debería añadir");
      const synced = planMarkSynced(added.record, 5400, T0 + HOUR);
      expect(synced).toMatchObject({ running: false, startedAt: null, accumulatedSeconds: 0, comment: "", segments: [] });
    });

    it("no deja tiempo negativo si se envió más de lo que queda", () => {
      const added = planManualAdd(undefined, task, 600, today, T0);
      if (!added.ok) throw new Error("debería añadir");
      expect(planMarkSynced(added.record, 900, T0).accumulatedSeconds).toBe(0);
    });
  });
});
