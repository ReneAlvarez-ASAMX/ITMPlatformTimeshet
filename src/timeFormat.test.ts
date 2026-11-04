import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatShort,
  hhmmToSeconds,
  secondsToHHMM,
  startOfWeek,
  toIsoDate,
  workdaySeconds,
} from "./timeFormat";

describe("timeFormat", () => {
  it("convierte entre segundos y h:mm", () => {
    expect(secondsToHHMM(0)).toBe("0:00");
    expect(secondsToHHMM(5400)).toBe("1:30");
    expect(hhmmToSeconds("1:30")).toBe(5400);
    expect(hhmmToSeconds(null)).toBe(0);
    expect(hhmmToSeconds("no")).toBe(0);
  });

  it("formatea el reloj y la forma corta", () => {
    expect(formatClock(3661)).toBe("01:01:01");
    expect(formatClock(-5)).toBe("00:00:00");
    expect(formatShort(45 * 60)).toBe("45m");
    expect(formatShort(2 * 3600)).toBe("2h");
    expect(formatShort(90 * 60)).toBe("1h 30m");
  });

  it("la semana empieza en lunes", () => {
    expect(toIsoDate(startOfWeek(new Date(2026, 10, 4)))).toBe("2026-11-02"); // miércoles
    expect(toIsoDate(startOfWeek(new Date(2026, 10, 8)))).toBe("2026-11-02"); // domingo
  });

  it("jornada de 8 h solo de lunes a viernes", () => {
    expect(workdaySeconds("2026-11-06")).toBe(8 * 3600); // viernes
    expect(workdaySeconds("2026-11-07")).toBe(0); // sábado
  });
});
