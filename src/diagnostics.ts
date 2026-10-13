// Envía al registro local (proceso principal) los errores de la interfaz que de otro modo se perderían.

export function reportRendererLog(level: "info" | "warn" | "error", message: string, detail?: string): void {
  try {
    if (window.itm?.logRenderer) window.itm.logRenderer(level, message, detail);
    else console.error(`[interfaz] ${message}`, detail ?? ""); // sin puente: lo recoge la consola de la ventana
  } catch {
    // El registro nunca debe romper la interfaz.
  }
}

export function installRendererLogging(): void {
  if (!window.itm) {
    reportRendererLog("error", "El puente con la aplicación (window.itm) no está disponible: falló la precarga.");
  }
  window.addEventListener("error", (event) => {
    const where = event.filename ? ` (${event.filename}:${event.lineno}:${event.colno})` : "";
    reportRendererLog("error", `Error no controlado: ${event.message}${where}`, event.error?.stack);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason: any = event.reason;
    reportRendererLog(
      "error",
      `Promesa rechazada sin controlar: ${reason?.message ?? String(reason)}`,
      reason?.stack
    );
  });
}
