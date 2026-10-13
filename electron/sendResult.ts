import type { SubmitTimeEntriesResponse } from "./types";

/**
 * Criterio ÚNICO (interfaz y registro de envíos) para dar cada tarea de un envío por enviada o fallida:
 *  - las tareas que ITM Platform lista en `Errors` han fallado, con su mensaje;
 *  - si la respuesta es un error general (código >= 400) sin detalle por tarea, han fallado todas;
 *  - el resto se da por enviado.
 */
export function classifyResponse(
  res: SubmitTimeEntriesResponse,
  workItemIds: number[]
): { failed: Map<number, string>; okIds: number[] } {
  const failed = new Map<number, string>();
  for (const e of res.Errors ?? []) failed.set(e.WorkItemId, e.Message);
  if (res.StatusCode >= 400 && failed.size === 0) {
    for (const id of workItemIds) failed.set(id, res.StatusMessage);
  }
  return { failed, okIds: workItemIds.filter((id) => !failed.has(id)) };
}
