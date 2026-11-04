import { describe, expect, it } from "vitest";
import { classifyResponse } from "./sendResult";

describe("classifyResponse", () => {
  it("con StatusCode < 400 solo fallan las tareas listadas en Errors", () => {
    const res = { StatusCode: 200, StatusMessage: "OK", Errors: [{ EntityId: 1, WorkItemId: 1, Message: "mal" }] };
    const { failed, okIds } = classifyResponse(res, [1, 2]);
    expect([...failed]).toEqual([[1, "mal"]]);
    expect(okIds).toEqual([2]);
  });

  it("con StatusCode >= 400 y sin detalle fallan todas", () => {
    const { failed, okIds } = classifyResponse({ StatusCode: 500, StatusMessage: "Error" }, [1, 2]);
    expect([...failed]).toEqual([
      [1, "Error"],
      [2, "Error"],
    ]);
    expect(okIds).toEqual([]);
  });

  // Ticket §1.2: la API rechaza el lote entero aunque Errors[] solo liste las entradas inválidas.
  it("con StatusCode >= 400 no da por enviada ninguna tarea aunque no esté en Errors", () => {
    const res = {
      StatusCode: 400,
      StatusMessage: "Bad Request",
      Errors: [{ EntityId: 1, WorkItemId: 1, Message: "La tarea no existe" }],
    };
    const { failed, okIds, rejected } = classifyResponse(res, [1, 2]);
    expect(okIds).toEqual([]);
    expect(rejected).toBe(true);
    expect(failed.get(1)).toBe("La tarea no existe");
    expect(failed.has(2)).toBe(true);
  });
});
