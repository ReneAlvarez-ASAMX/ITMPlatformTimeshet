// Interpreta una duración escrita a mano en varios formatos y la convierte a segundos.
//
// Formatos admitidos (mayúsculas, espacios y coma decimal indiferentes):
//   h:mm · hh:mm · h:mm:ss    1:30   01:30   :45        -> horas y minutos
//   2h30m · 2h 30m · 2h30     2 horas 30 minutos         -> horas y minutos con unidades
//   2.5h · 2,5h · 1.25 h                                 -> horas decimales
//   45m · 90 min · 45 minutos                            -> solo minutos
//   2 · 2.5 · 0,75                                       -> número suelto = horas
//   45 · 90 (número suelto mayor que 24)                 -> minutos (no cabe como horas en un día)
//
// El resultado se redondea al minuto y NO puede superar 24 horas.

export const MAX_DURATION_SECONDS = 24 * 3600;

export type DurationResult =
  | { ok: true; seconds: number }
  | { ok: false; reason: "empty" | "invalid" | "too-long" };

const HOUR_UNITS = "h|hr|hrs|hora|horas|hour|hours";
const MINUTE_UNITS = "m|min|mins|minuto|minutos|minute|minutes";

const COLON = /^(\d{1,2})?:(\d{1,2})(?::(\d{1,2}))?$/;
const HOURS_AND_MINUTES = new RegExp(
  `^(\\d+(?:\\.\\d+)?)\\s*(?:${HOUR_UNITS})\\s*(?:(\\d+)\\s*(?:${MINUTE_UNITS})?)?$`
);
const ONLY_MINUTES = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(?:${MINUTE_UNITS})$`);
const BARE_NUMBER = /^\d+(?:\.\d+)?$/;

const INVALID: DurationResult = { ok: false, reason: "invalid" };

/** Redondea al minuto y aplica el límite de 24 h (un número desmesurado también cuenta como «demasiado largo»). */
function finish(seconds: number): DurationResult {
  if (!Number.isFinite(seconds) || seconds > MAX_DURATION_SECONDS + 30) {
    return { ok: false, reason: "too-long" };
  }
  const rounded = Math.round(seconds / 60) * 60;
  return rounded > MAX_DURATION_SECONDS ? { ok: false, reason: "too-long" } : { ok: true, seconds: rounded };
}

/** Interpreta la duración y, si no es válida, dice por qué: vacía, no se entiende o supera las 24 h. */
export function parseDurationResult(input: string): DurationResult {
  // "2,5h" -> "2.5h"; se ignoran los espacios sobrantes y las mayúsculas
  const s = input
    .trim()
    .toLowerCase()
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, " ");
  if (!s) return { ok: false, reason: "empty" };

  let m = COLON.exec(s);
  if (m) {
    const hours = m[1] ? parseInt(m[1], 10) : 0;
    const minutes = parseInt(m[2], 10);
    const seconds = m[3] ? parseInt(m[3], 10) : 0;
    if (minutes > 59 || seconds > 59) return INVALID;
    return finish(hours * 3600 + minutes * 60 + seconds);
  }

  m = HOURS_AND_MINUTES.exec(s);
  if (m) {
    const hoursText = m[1];
    const hasMinutes = m[2] !== undefined;
    // "2.5h30m" no tiene sentido: con horas decimales no se admiten minutos aparte
    if (hasMinutes && hoursText.includes(".")) return INVALID;
    const minutes = hasMinutes ? parseInt(m[2], 10) : 0;
    if (minutes > 59) return INVALID;
    return finish(parseFloat(hoursText) * 3600 + minutes * 60);
  }

  m = ONLY_MINUTES.exec(s);
  if (m) return finish(parseFloat(m[1]) * 60);

  if (BARE_NUMBER.test(s)) {
    const value = parseFloat(s);
    // Hasta 24 se entiende como horas; más de 24 no cabe en un día como horas, así que son minutos.
    return finish(value <= 24 ? value * 3600 : value * 60);
  }

  return INVALID;
}

/** Segundos de la duración escrita, o null si no es válida (vacía, no se entiende o supera las 24 h). */
export function parseDuration(input: string): number | null {
  const result = parseDurationResult(input);
  return result.ok ? result.seconds : null;
}
