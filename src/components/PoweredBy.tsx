import logo from "../assets/actual-solutions-logo.png";
import { useI18n } from "../i18n";

const TOOL_URL = "https://actualsolutions.tech/timesheet-itm-platform.html";

/** Pie con el logo y la leyenda de Actual Solutions; ambos enlazan a la página pública de la herramienta. */
export function PoweredBy() {
  const { t } = useI18n();
  return (
    <footer className="powered-by">
      <a href={TOOL_URL} target="_blank" rel="noopener noreferrer" title="Actual Solutions">
        <img src={logo} alt="Actual Solutions" height={24} />
      </a>
      <a href={TOOL_URL} target="_blank" rel="noopener noreferrer" className="powered-by-text">
        {t("app.poweredBy")}
      </a>
    </footer>
  );
}
