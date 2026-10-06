import { formatShort } from "../timeFormat";
import { useI18n } from "../i18n";

interface Props {
  /** Segundos laborables del día (8 h de lunes a viernes, 0 en fin de semana). */
  targetSeconds: number;
  /** Segundos ya reportados en ITM Platform para el día. */
  reportedSeconds: number;
  /** Segundos de los temporizadores del día que aún no se han enviado a ITM Platform. */
  pendingSeconds: number;
}

/** "8h" en lugar de "8h 0m" para horas exactas. */
function formatHours(seconds: number): string {
  const text = formatShort(seconds);
  return text.endsWith(" 0m") ? text.slice(0, -3) : text;
}

export function DayProgress({ targetSeconds, reportedSeconds, pendingSeconds }: Props) {
  const { t } = useI18n();
  const totalSeconds = reportedSeconds + pendingSeconds;
  const hasTarget = targetSeconds > 0;
  const percent = hasTarget ? Math.round((totalSeconds / targetSeconds) * 100) : null;
  const complete = percent !== null && percent >= 100;

  // La barra representa la jornada; si se supera, las partes se reparten sobre el total para no salirse.
  const scale = Math.max(targetSeconds, totalSeconds);
  const width = (seconds: number) => (scale > 0 ? `${(seconds / scale) * 100}%` : "0%");

  const summary = hasTarget
    ? t("day.summary", { total: formatHours(totalSeconds), target: formatHours(targetSeconds) })
    : t("day.summaryNonWorking", { total: formatHours(totalSeconds) });

  return (
    <div className="day-progress" title={summary}>
      <div
        className="day-progress-bar"
        role="progressbar"
        aria-label={t("day.progressLabel")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent ?? 0, 100)}
        aria-valuetext={percent !== null ? `${percent}%` : t("day.nonWorking")}
      >
        <div className="day-progress-seg reported" style={{ width: width(reportedSeconds) }} />
        <div className="day-progress-seg pending" style={{ width: width(pendingSeconds) }} />
      </div>
      <span className={`day-progress-pct ${complete ? "complete" : ""}`}>
        {percent !== null ? `${percent}%` : "—"}
      </span>
      <div className="day-progress-legend">
        <span>
          <i className="dot reported" />
          {t("day.inItm", { time: formatHours(reportedSeconds) })}
        </span>
        <span>
          <i className="dot pending" />
          {t("day.unsent", { time: formatHours(pendingSeconds) })}
        </span>
        <span>
          {hasTarget ? t("day.workday", { time: formatHours(targetSeconds) }) : t("day.nonWorking")}
        </span>
      </div>
    </div>
  );
}
