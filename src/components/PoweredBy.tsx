import logo from "../assets/actual-solutions-logo.png";
import { useState } from "react";
import { useI18n } from "../i18n";

const TOOL_URL = "https://actualsolutions.tech/timesheet-itm-platform.html";

/** Pie con el logo y la leyenda de Actual Solutions; ambos enlazan a la página pública de la herramienta. */
export function PoweredBy() {
  const { t } = useI18n();
  const [note, setNote] = useState<string | null>(null);

  const saveLog = async () => {
    let ok = false;
    try {
      const res = await window.itm.exportDiagnostics();
      // Si el usuario cancela el diálogo no se muestra ningún mensaje.
      if (res.cancelled) return;
      ok = res.ok;
    } catch {
      ok = false;
    }
    setNote(t(ok ? "diag.saved" : "diag.failed"));
    setTimeout(() => setNote(null), 6000);
  };

  return (
    <footer className="powered-by">
      <a href={TOOL_URL} target="_blank" rel="noopener noreferrer" title="Actual Solutions">
        <img src={logo} alt="Actual Solutions" height={24} />
      </a>
      <a href={TOOL_URL} target="_blank" rel="noopener noreferrer" className="powered-by-text">
        {t("app.poweredBy")}
      </a>
      <button type="button" className="btn-link powered-by-log" onClick={saveLog}>
        {note ?? t("diag.button")}
      </button>
    </footer>
  );
}
