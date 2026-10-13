import type { TimesheetResponse } from "../electron/types";
import { hhmmToSeconds } from "./timeFormat";

export interface ExistingHours {
  /** Horas ya reportadas en ITM Platform, por clave `${tarea}_${fecha}`, de las fechas consultadas con éxito. */
  existing: Map<string, number>;
  /** Fechas que no se pudieron consultar, con el motivo. */
  failed: Map<string, string>;
}

/**
 * Consulta lo ya reportado en ITM Platform fecha por fecha. Si una fecha falla, las demás se
 * resuelven igualmente: así un único día problemático no bloquea el resto ni deja la pantalla de
 * revisión sin filas. Las tareas de una fecha fallida no deben enviarse (se desconoce lo que ya hay
 * y se sobrescribiría).
 */
export async function fetchExistingPerDate(
  dates: string[],
  fetchDay: (date: string) => Promise<TimesheetResponse>
): Promise<ExistingHours> {
  const unique = [...new Set(dates)];
  const settled = await Promise.allSettled(unique.map((date) => fetchDay(date)));
  const existing = new Map<string, number>();
  const failed = new Map<string, string>();
  settled.forEach((result, i) => {
    if (result.status === "rejected") {
      const reason = result.reason as { message?: string } | undefined;
      failed.set(unique[i], reason?.message ?? String(result.reason));
      return;
    }
    for (const project of result.value.TimeReports) {
      for (const wi of project.WorkItems) {
        for (const entry of wi.TimeEntries) {
          existing.set(`${wi.WorkItemId}_${entry.Date}`, hhmmToSeconds(entry.ReportedHours));
        }
      }
    }
  });
  return { existing, failed };
}
