import { useEffect, useState } from "react";
import type { UpdateStatus } from "../../electron/types";
import { Icon } from "./Icon";

export function UpdateControl() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.itm.getUpdateStatus().then(setStatus);
    return window.itm.onUpdateStatus(setStatus);
  }, []);

  if (!status) return null;

  const updateReady = status.state === "available" || status.state === "downloaded";
  const label = updateReady
    ? `Actualizar a v${status.version}`
    : status.state === "downloading"
    ? `Descargando… ${status.percent ?? 0}%`
    : `v${status.currentVersion}`;

  return (
    <div className="reminder-control">
      <button
        className={`header-btn ${updateReady ? "update-available" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {updateReady && <Icon name="arrow-up-circle" />}
        {label}
      </button>
      {open && (
        <div className="reminder-panel">
          <UpdateBody status={status} />
          <div className="reminder-panel-actions">
            <button type="button" className="btn-link" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateBody({ status }: { status: UpdateStatus }) {
  const current = <p className="reminder-hint">Versión instalada: v{status.currentVersion}</p>;

  switch (status.state) {
    case "unsupported":
      return (
        <>
          {current}
          <p className="reminder-hint">
            Las actualizaciones automáticas solo están disponibles en la app instalada para Windows.
          </p>
        </>
      );
    case "checking":
      return (
        <>
          {current}
          <p className="reminder-hint">Buscando actualizaciones…</p>
        </>
      );
    case "available":
      return (
        <>
          {current}
          <p className="reminder-hint">Hay una nueva versión: v{status.version}.</p>
          <button type="button" onClick={() => window.itm.downloadUpdate()}>
            Descargar
          </button>
        </>
      );
    case "downloading":
      return (
        <>
          {current}
          <p className="reminder-hint">
            Descargando v{status.version}… {status.percent ?? 0}%
          </p>
        </>
      );
    case "downloaded":
      return (
        <>
          {current}
          <p className="reminder-hint">
            La versión v{status.version} está descargada. La app se cerrará y volverá a abrirse al
            instalar.
          </p>
          <button type="button" onClick={() => window.itm.installUpdate()}>
            Reiniciar e instalar
          </button>
        </>
      );
    case "error":
      return (
        <>
          {current}
          <div className="error-box">{status.error ?? "No se pudo completar la actualización."}</div>
          <button type="button" onClick={() => window.itm.checkForUpdates()}>
            Reintentar
          </button>
        </>
      );
    case "not-available":
    case "idle":
    default:
      return (
        <>
          {current}
          {status.state === "not-available" && <p className="reminder-hint">Estás al día.</p>}
          <button type="button" onClick={() => window.itm.checkForUpdates()}>
            Buscar actualizaciones
          </button>
        </>
      );
  }
}
