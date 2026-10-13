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
// Devuelve null si no se entiende. El resultado se redondea al minuto y no puede superar 24 h.

const MAX_SECONDS = 24 * 3600;

const HOUR_UNITS = "h|hr|hrs|hora|horas|hour|hours";
const MINUTE_UNITS = "m|min|mins|minuto|minutos|minute|minutes";

const COLON = /^(\d{1,2})?:(\d{1,2})(?::(\d{1,2}))?$/;
const HOURS_AND_MINUTES = new RegExp(
  `^(\\d+(?:\\.\\d+)?)\\s*(?:${HOUR_UNITS})\\s*(?:(\\d+)\\s*(?:${MINUTE_UNITS})?)?$`
);
const ONLY_MINUTES = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*(?:${MINUTE_UNITS})$`);
const BARE_NUMBER = /^\d+(?:\.\d+)?$/;

function finish(seconds: number): number | null {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const rounded = Math.round(seconds / 60) * 60;
  return rounded > MAX_SECONDS ? null : rounded;
}

export function parseDuration(input: string): number | null {
  // "2,5h" -> "2.5h"; se ignoran los espacios sobrantes y las mayúsculas
  const s = input
    .trim()
    .toLowerCase()
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, " ");
  if (!s) return null;

  let m = COLON.exec(s);
  if (m) {
    const hours = m[1] ? parseInt(m[1], 10) : 0;
    const minutes = parseInt(m[2], 10);
    const seconds = m[3] ? parseInt(m[3], 10) : 0;
    if (minutes > 59 || seconds > 59) return null;
    return finish(hours * 3600 + minutes * 60 + seconds);
  }

  m = HOURS_AND_MINUTES.exec(s);
  if (m) {
    const hoursText = m[1];
    const hasMinutes = m[2] !== undefined;
    // "2.5h30m" no tiene sentido: con horas decimales no se admiten minutos aparte
    if (hasMinutes && hoursText.includes(".")) return null;
    const minutes = hasMinutes ? parseInt(m[2], 10) : 0;
    if (minutes > 59) return null;
    return finish(parseFloat(hoursText) * 3600 + minutes * 60);
  }

  m = ONLY_MINUTES.exec(s);
  if (m) return finish(parseFloat(m[1]) * 60);

  if (BARE_NUMBER.test(s)) {
    const value = parseFloat(s);
    // Hasta 24 se entiende como horas; más de 24 no cabe en un día como horas, así que son minutos.
    return finish(value <= 24 ? value * 3600 : value * 60);
  }

  return null;
}
