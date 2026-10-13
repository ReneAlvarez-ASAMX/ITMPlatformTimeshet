import { app, screen } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Registro de comportamiento de la app (arranque, ventana, llamadas internas, errores del proceso
// principal y de la interfaz). Pensado para que un usuario lo guarde con un clic y lo envíe a soporte.
// - Archivo de texto en <datos de usuario>/logs/app.log; al llegar a MAX_BYTES se rota a app.1.log
//   (se conservan como máximo dos archivos).
// - Nunca debe romper la app: cualquier fallo al escribir se ignora.
// - No registra credenciales ni el contenido de las llamadas; además se enmascaran claves y tokens.

const MAX_BYTES = 1_000_000;
const MAX_DETAIL_CHARS = 6_000;

export type LogLevel = "INFO" | "WARN" | "ERROR";

let currentSize: number | null = null;

function logDir(): string {
  return path.join(app.getPath("userData"), "logs");
}

export function logFilePath(): string {
  return path.join(logDir(), "app.log");
}

function rotatedFilePath(): string {
  return path.join(logDir(), "app.1.log");
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function timestamp(d: Date = new Date()): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  );
}

/** Enmascara valores sensibles (API Key, tokens, cabeceras de autorización) que pudieran colarse en un mensaje. */
export function redact(text: string): string {
  return text
    .replace(/(api[-_ ]?key|token|authorization|password|secret)(["']?\s*[:=]\s*["']?)(bearer\s+)?([^\s"',;&}]+)/gi, "$1$2[oculto]")
    .replace(/[A-Za-z0-9_-]{40,}/g, "[oculto]");
}

function describe(detail: unknown): string {
  if (detail === undefined || detail === null) return "";
  let text: string;
  if (detail instanceof Error) text = detail.stack ?? `${detail.name}: ${detail.message}`;
  else if (typeof detail === "string") text = detail;
  else {
    try {
      text = JSON.stringify(detail);
    } catch {
      text = String(detail);
    }
  }
  return text.length > MAX_DETAIL_CHARS ? text.slice(0, MAX_DETAIL_CHARS) + "…[recortado]" : text;
}

function rotateIfNeeded(file: string, incoming: number) {
  if (currentSize === null) {
    try {
      currentSize = fs.statSync(file).size;
    } catch {
      currentSize = 0;
    }
  }
  if (currentSize + incoming <= MAX_BYTES) return;
  try {
    fs.rmSync(rotatedFilePath(), { force: true });
    fs.renameSync(file, rotatedFilePath());
  } catch {
    // Si no se puede rotar se sigue escribiendo en el mismo archivo.
  }
  currentSize = 0;
}

export function log(level: LogLevel, scope: string, message: string, detail?: unknown): void {
  try {
    const extra = describe(detail);
    const head = `${timestamp()} [${level}] [${scope}] ${message}`;
    const text = redact(extra ? `${head}\n${extra.replace(/^/gm, "    ")}` : head) + "\n";
    const file = logFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    rotateIfNeeded(file, Buffer.byteLength(text));
    fs.appendFileSync(file, text, "utf-8");
    currentSize = (currentSize ?? 0) + Buffer.byteLength(text);
  } catch {
    // El registro nunca debe afectar a la app.
  }
}

export const info = (scope: string, message: string, detail?: unknown) => log("INFO", scope, message, detail);
export const warn = (scope: string, message: string, detail?: unknown) => log("WARN", scope, message, detail);
export const error = (scope: string, message: string, detail?: unknown) => log("ERROR", scope, message, detail);

/** Primera entrada de cada arranque: versión, sistema y pantalla. */
export function logStartup(extra: Record<string, unknown> = {}): void {
  info("app", "──────── Arranque ────────");
  info("app", "Datos de la aplicación", {
    version: app.getVersion(),
    empaquetada: app.isPackaged,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    sistema: `${os.type()} ${os.release()} (${process.platform}/${process.arch})`,
    idiomaSistema: app.getLocale(),
    argumentos: process.argv.slice(1),
    ...extra,
  });
}

/** Pantallas conectadas (tamaño y escala): útil para problemas de ventana en blanco o mal escalada. */
export function logDisplays(): void {
  try {
    info(
      "app",
      "Pantallas",
      screen.getAllDisplays().map((d) => ({
        tamaño: `${d.size.width}x${d.size.height}`,
        escala: d.scaleFactor,
        principal: d.id === screen.getPrimaryDisplay().id,
      }))
    );
  } catch (err) {
    warn("app", "No se pudieron leer las pantallas", err);
  }
}

// ---------- Informe para soporte ----------

// Archivos con secretos: solo se informa de que existen, nunca se leen.
const SECRET_FILE = /^(credentials|session)/i;

function fileHealth(dir: string): string[] {
  const lines: string[] = [];
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir).filter((n) => /\.(json|csv)$/i.test(n));
  } catch (err: any) {
    return [`No se pudo leer la carpeta de datos: ${err?.message ?? err}`];
  }
  for (const name of names.sort()) {
    const full = path.join(dir, name);
    try {
      const stat = fs.statSync(full);
      let estado = "";
      if (name.toLowerCase().endsWith(".json") && !SECRET_FILE.test(name)) {
        try {
          JSON.parse(fs.readFileSync(full, "utf-8"));
          estado = "JSON válido";
        } catch (err: any) {
          estado = `JSON DAÑADO (${err?.message ?? err})`;
        }
      } else if (SECRET_FILE.test(name)) {
        estado = "no se lee (contiene datos de acceso)";
      }
      lines.push(`${name}: ${stat.size} bytes, modificado ${timestamp(stat.mtime)}${estado ? `, ${estado}` : ""}`);
    } catch (err: any) {
      lines.push(`${name}: no se pudo leer (${err?.message ?? err})`);
    }
  }
  return lines.length ? lines : ["(sin archivos)"];
}

function readIfExists(file: string): string {
  try {
    return fs.readFileSync(file, "utf-8");
  } catch {
    return "";
  }
}

/** Texto completo del informe de diagnóstico: resumen del equipo, estado de los archivos y el registro. */
export async function buildReport(): Promise<string> {
  let gpu = "(no disponible)";
  try {
    gpu = JSON.stringify(app.getGPUFeatureStatus());
  } catch {
    // Sin dato de GPU.
  }
  const header = [
    "INFORME DE DIAGNÓSTICO — ITM Platform Timesheet",
    `Generado: ${timestamp()}`,
    `Versión: ${app.getVersion()} (${app.isPackaged ? "instalada" : "desarrollo"})`,
    `Sistema: ${os.type()} ${os.release()} ${process.arch}`,
    `Electron ${process.versions.electron} · Chrome ${process.versions.chrome}`,
    `Idioma del sistema: ${app.getLocale()}`,
    `Memoria libre: ${Math.round(os.freemem() / 1048576)} MB de ${Math.round(os.totalmem() / 1048576)} MB`,
    `GPU: ${gpu}`,
    "",
    "Archivos de datos de la app:",
    ...fileHealth(app.getPath("userData")).map((l) => `  ${l}`),
    "",
    "──────── REGISTRO ────────",
    "",
  ].join("\r\n");
  const body = (readIfExists(rotatedFilePath()) + readIfExists(logFilePath())).replace(/\r?\n/g, "\r\n");
  return redact(header + body);
}
