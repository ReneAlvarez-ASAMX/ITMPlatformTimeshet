import { describe, expect, it } from "vitest";
import { MAX_DURATION_SECONDS, parseDuration, parseDurationResult } from "./duration";

describe("parseDuration", () => {
  it.each([
    ["1:30", 90 * 60],
    ["01:30", 90 * 60],
    [":45", 45 * 60],
    ["2h30m", 150 * 60],
    ["2h 30m", 150 * 60],
    ["2 horas 30 minutos", 150 * 60],
    ["2,5h", 150 * 60],
    ["1.25 h", 75 * 60],
    ["45m", 45 * 60],
    ["90 min", 90 * 60],
    ["2", 2 * 3600],
    ["0,75", 45 * 60],
    ["45", 45 * 60], // más de 24 => minutos
    ["  2H30M  ", 150 * 60],
  ])("interpreta %j", (input, seconds) => {
    expect(parseDuration(input)).toBe(seconds);
  });

  it("redondea al minuto", () => {
    expect(parseDuration("0:00:29")).toBe(0);
    expect(parseDuration("0:00:30")).toBe(60);
  });

  it("admite exactamente 24 h", () => {
    expect(parseDuration("24h")).toBe(MAX_DURATION_SECONDS);
  });
});

describe("parseDurationResult", () => {
  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["abc", "invalid"],
    ["1:75", "invalid"],
    ["2.5h30m", "invalid"],
    ["2h75m", "invalid"],
    ["25h", "too-long"],
    ["24:01", "too-long"],
    ["1e400", "invalid"],
  ])("rechaza %j como %s", (input, reason) => {
    expect(parseDurationResult(input)).toEqual({ ok: false, reason });
  });
});
