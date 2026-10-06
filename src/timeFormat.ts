export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function secondsToHHMM(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function hhmmToSeconds(hhmm: string | undefined | null): number {
  if (!hhmm) return 0;
  const match = /^(\d+):(\d{1,2})$/.exec(hhmm.trim());
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 3600 + minutes * 60;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export function formatShort(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // semana empieza en lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/** Formatea un epoch (ms) como hora local "HH:MM", para mostrar cuándo empezó un cronómetro. */
export function timeOfDay(epochMs: number): string {
  const d = new Date(epochMs);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Construye el epoch (ms) de hoy a la hora "HH:MM" indicada, o null si el formato no es válido. */
export function todayAtTime(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0).getTime();
}

/** Horas de una jornada laborable estándar (lunes a viernes). */
export const WORKDAY_HOURS = 8;

/** Segundos laborables de una fecha ISO "YYYY-MM-DD": 8 h de lunes a viernes y 0 en fin de semana. */
export function workdaySeconds(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0 = domingo, 6 = sábado
  return weekday >= 1 && weekday <= 5 ? WORKDAY_HOURS * 3600 : 0;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(options);
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, f);
  }
  return f;
}

/** Día de la semana abreviado ("lun", "Mon", "seg") en la configuración regional indicada. */
export function weekdayShort(date: Date, locale = "es-ES"): string {
  return formatter(locale, { weekday: "short" }).format(date).replace(/\.$/, "");
}

/** Formatea una fecha ISO "YYYY-MM-DD" como "jueves, 13 de agosto" (según el idioma). */
export function formatDayLabel(isoDate: string, locale = "es-ES"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return formatter(locale, { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(y, m - 1, d)
  );
}

/** Formatea una fecha ISO "YYYY-MM-DD" como "13 ago" (según el idioma). */
export function formatDayShort(isoDate: string, locale = "es-ES"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return formatter(locale, { day: "2-digit", month: "short" }).format(new Date(y, m - 1, d));
}

/** Rango corto de una semana, por ejemplo "05 oct – 11 oct". */
export function formatWeekRange(start: Date, end: Date, locale = "es-ES"): string {
  const f = formatter(locale, { day: "2-digit", month: "short" });
  return `${f.format(start)} – ${f.format(end)}`;
}
