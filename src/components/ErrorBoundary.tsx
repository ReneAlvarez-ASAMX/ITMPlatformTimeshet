import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { DEFAULT_LANGUAGE, translate } from "../../electron/i18n";
import type { Language, MessageKey } from "../../electron/i18n";
import { reportRendererLog } from "../diagnostics";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Evita la ventana en blanco: si la interfaz falla, deja el error en el registro y ofrece guardarlo para soporte. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportRendererLog("error", `Error al dibujar la interfaz: ${error.message}`, `${error.stack}\n${info.componentStack}`);
  }

  render() {
    return this.state.error ? <CrashScreen error={this.state.error} /> : this.props.children;
  }
}

// Vive fuera del proveedor de idioma (que también podría fallar), así que lee el idioma por su cuenta.
function CrashScreen({ error }: { error: Error }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [note, setNote] = useState<string | null>(null);
  const t = (key: MessageKey) => translate(language, key);

  useEffect(() => {
    window.itm?.getLanguage().then(setLanguage).catch(() => {});
  }, []);

  const saveLog = async () => {
    try {
      const res = await window.itm.exportDiagnostics();
      if (res.ok) setNote(translate(language, "diag.saved"));
      else if (!res.cancelled) setNote(translate(language, "diag.failed"));
    } catch {
      setNote(translate(language, "diag.failed"));
    }
  };

  return (
    <div className="crash-screen">
      <h1>{t("diag.errorTitle")}</h1>
      <p>{t("diag.errorBody")}</p>
      <pre className="crash-detail">{error.message}</pre>
      <div className="crash-actions">
        <button type="button" onClick={saveLog}>
          {t("diag.button")}
        </button>
        <button type="button" className="btn-link" onClick={() => window.location.reload()}>
          {t("diag.reload")}
        </button>
      </div>
      {note && <p>{note}</p>}
    </div>
  );
}
