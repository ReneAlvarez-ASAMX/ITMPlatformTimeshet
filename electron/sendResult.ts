import type { SubmitTimeEntriesResponse } from "./types";

/**
 * Criterio ÚNICO (interfaz y registro de envíos) para dar cada tarea de un envío por enviada o fallida:
 *  - las tareas que ITM Platform lista en `Errors` han fallado, con su mensaje;
 *  - si la respuesta es un error general (código >= 400), ITM Platform ha rechazado el lote ENTERO
 *    (`Errors` solo lista las entradas inválidas): han fallado todas y `rejected` es true. Quien quiera
 *    dar alguna por enviada debe comprobarlo releyendo las horas del servidor;
 *  - en otro caso, el resto se da por enviado.
 */
export function classifyResponse(
  res: SubmitTimeEntriesResponse,
  workItemIds: number[]
): { failed: Map<number, string>; okIds: number[]; rejected: boolean } {
  const failed = new Map<number, string>();
  for (const e of res.Errors ?? []) failed.set(e.WorkItemId, e.Message);
  const rejected = res.StatusCode >= 400;
  if (rejected) {
    for (const id of workItemIds) if (!failed.has(id)) failed.set(id, res.StatusMessage);
  }
  return { failed, okIds: workItemIds.filter((id) => !failed.has(id)), rejected };
}
