import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SubmitTimeEntriesRequest,
  SubmitTimeEntriesResponse,
  TimerRecord,
  TimesheetResponse,
} from "../../electron/types";
import { planMarkSynced } from "../timerLogic";
import { collectPending, sendPending } from "./useSync";

const DATE = "2026-11-04";
const at = (hh: number, mm = 0, ss = 0) => new Date(2026, 10, 4, hh, mm, ss).getTime();
const t = (key: string) => key;

function record(workItemId: number, init: Partial<TimerRecord>): TimerRecord {
  return {
    workItemId,
    entityId: 100,
    taskName: `Tarea ${workItemId}`,
    projectName: "Proyecto",
    date: DATE,
    startedAt: null,
    accumulatedSeconds: 0,
    running: false,
    comment: "",
    segments: [],
    ...init,
  };
}

/** Pendiente calculado con el reloj en el momento de la llamada, como hace la pantalla al enviar. */
function livePending(timers: Record<string, TimerRecord>) {
  return () =>
    collectPending(
      timers,
      (id) => {
        const r = timers[String(id)];
        return r.accumulatedSeconds + (r.running && r.startedAt ? (Date.now() - r.startedAt) / 1000 : 0);
      },
      Date.now()
    );
}

/** Respuesta de /timehours con las horas indicadas por tarea para DATE. */
function timesheet(hours: Record<number, string>): TimesheetResponse {
  return {
    Timeframe: { PeriodStart: DATE, PeriodEnd: DATE },
    User: { UserId: 1, PersonnelNumber: "", DisplayName: "", UserPicture32x32: "" },
    WorkingHours: [],
    TimeReports: [
      {
        Type: "Project",
        EntityNo: "P1",
        Completed: false,
        EntityId: 100,
        Name: "Proyecto",
        IsManager: false,
        OrderOnList: 0,
        WorkItems: Object.entries(hours).map(([id, reported]) => ({
          Type: "Task",
          WorkItemNo: id,
          Completed: false,
          WorkItemId: Number(id),
          Name: `Tarea ${id}`,
          IsManager: false,
          ProgressReportAllowed: true,
          CommentsAllowed: true,
          PreviousHoursAccum: "0:00",
          TimeEntries: [
            {
              Date: DATE,
              EditingAllowed: true,
              TimeEntryAllowed: true,
              EstimatedHours: "0:00",
              ReportedHours: reported,
              UserComments: null,
              Approval: null,
            },
          ],
        })),
      },
    ],
  };
}

let getTimesheet: ReturnType<typeof vi.fn>;
let submitTimeEntries: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  getTimesheet = vi.fn();
  submitTimeEntries = vi.fn();
  (globalThis as any).window = { itm: { getTimesheet, submitTimeEntries } };
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as any).window;
});

describe("sendPending", () => {
  // Ticket §1.1: A desde las 09:00, B desde las 11:00 y envío a las 13:00.
  it("envía el tiempo vivo en el momento del envío y conserva lo que transcurre mientras tanto", async () => {
    const timers = {
      "1": record(1, { running: true, startedAt: at(9) }),
      "2": record(2, { running: true, startedAt: at(11) }),
    };
    vi.setSystemTime(at(13));
    getTimesheet.mockResolvedValue(timesheet({}));
    submitTimeEntries.mockImplementation(async (_payload: SubmitTimeEntriesRequest) => {
      vi.setSystemTime(at(13, 0, 3)); // la respuesta tarda 3 s
      return { StatusCode: 200, StatusMessage: "OK" } satisfies SubmitTimeEntriesResponse;
    });

    const outcome = await sendPending(livePending(timers), t);

    const payload = submitTimeEntries.mock.calls[0][0] as SubmitTimeEntriesRequest;
    const sent = Object.fromEntries(payload.TimeReports.map((e) => [e.WorkItemId, e.ReportedHours]));
    expect(sent).toEqual({ 1: "4:00", 2: "2:00" });
    expect(outcome.synced).toEqual([
      { workItemId: 1, seconds: 4 * 3600 },
      { workItemId: 2, seconds: 2 * 3600 },
    ]);

    // Al marcar como enviado se resta lo enviado: los 3 s de la respuesta siguen pendientes y A sigue en marcha.
    const a = planMarkSynced(timers["1"], outcome.synced[0].seconds, Date.now());
    expect(a).toMatchObject({ running: true, accumulatedSeconds: 3 });
  });

  // Ticket §1.2: con StatusCode >= 400 la API rechaza el lote entero.
  it("con el lote rechazado solo da por enviadas las entradas que el servidor confirma", async () => {
    const timers = {
      "1": record(1, { accumulatedSeconds: 3600 }), // tarea inválida
      "2": record(2, { accumulatedSeconds: 3600 }), // el servidor ya la tiene con el valor enviado
      "3": record(3, { accumulatedSeconds: 1800 }), // no se guardó
    };
    vi.setSystemTime(at(13));
    getTimesheet
      .mockResolvedValueOnce(timesheet({ 2: "1:00" })) // lo ya reportado antes de enviar
      .mockResolvedValueOnce(timesheet({ 2: "2:00", 3: "0:00" })); // relectura tras el rechazo
    submitTimeEntries.mockResolvedValue({
      StatusCode: 400,
      StatusMessage: "Bad Request",
      Errors: [{ EntityId: 100, WorkItemId: 1, Message: "La tarea no existe" }],
    } satisfies SubmitTimeEntriesResponse);

    const outcome = await sendPending(livePending(timers), t);

    expect(getTimesheet).toHaveBeenCalledTimes(2);
    expect(outcome.synced).toEqual([{ workItemId: 2, seconds: 3600 }]);
    expect(outcome.itemErrors[1]).toBe("La tarea no existe");
    expect(outcome.itemErrors[3]).toBe("sync.error.batchRejected");
    expect(outcome.itemErrors[2]).toBeUndefined();
    expect(outcome.lastError).toBe("Bad Request");
  });

  it("con el lote rechazado y sin poder releer, no da nada por enviado", async () => {
    const timers = {
      "1": record(1, { accumulatedSeconds: 3600 }),
      "2": record(2, { accumulatedSeconds: 3600 }),
    };
    vi.setSystemTime(at(13));
    getTimesheet.mockResolvedValueOnce(timesheet({})).mockRejectedValueOnce(new Error("sin red"));
    submitTimeEntries.mockResolvedValue({
      StatusCode: 400,
      StatusMessage: "Bad Request",
      Errors: [{ EntityId: 100, WorkItemId: 1, Message: "La tarea no existe" }],
    } satisfies SubmitTimeEntriesResponse);

    const outcome = await sendPending(livePending(timers), t);

    expect(outcome.synced).toEqual([]);
    expect(Object.keys(outcome.itemErrors).sort()).toEqual(["1", "2"]);
  });
});
