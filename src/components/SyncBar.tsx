import { addDays, formatDayShort, formatShort, formatWeekRange, toIsoDate, todayStr, workdaySeconds } from "../timeFormat";
import type { PendingItem } from "../hooks/useSync";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";

interface Props {
  pending: PendingItem[];
  syncing: boolean;
  lastError: string | null;
  itemErrors: Record<number, string>;
  onReview: () => void;
  /** Lunes de la semana que se está viendo. */
  weekStart: Date;
  /** Horas ya reportadas en ITM Platform en esa semana. */
  weekReportedSeconds: number;
  /** Horas sin enviar cuya fecha cae en esa semana. */
  weekPendingSeconds: number;
}

export function SyncBar({
  pending,
  syncing,
  lastError,
  itemErrors,
  onReview,
  weekStart,
  weekReportedSeconds,
  weekPendingSeconds,
}: Props) {
  const { t, locale } = useI18n();
  const totalSeconds = pending.reduce((sum, p) => sum + p.seconds, 0);
  const hasErrors = Object.keys(itemErrors).length > 0;

  // Resumen de la semana frente a su jornada (8 h de lunes a viernes).
  let weekTarget = 0;
  for (let i = 0; i < 7; i++) weekTarget += workdaySeconds(toIsoDate(addDays(weekStart, i)));
  const weekTotal = weekReportedSeconds + weekPendingSeconds;
  const weekText = t("week.summary", {
    range: formatWeekRange(weekStart, addDays(weekStart, 6), locale),
    reported: formatShort(weekReportedSeconds),
    pending: formatShort(weekPendingSeconds),
    total: formatShort(weekTotal),
    target: formatShort(weekTarget),
    percent: weekTarget > 0 ? Math.round((weekTotal / weekTarget) * 100) : 0,
  });

  // Tiempo sin enviar desglosado por la fecha a la que corresponde cada parte.
  const byDate = new Map<string, number>();
  for (const item of pending) byDate.set(item.date, (byDate.get(item.date) ?? 0) + item.seconds);
  const today = todayStr();
  const breakdown = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, seconds]) => {
      const label = date === today ? t("header.today") : formatDayShort(date, locale);
      return `${label}: ${formatShort(seconds)}`;
    })
    .join(" · ");
  const pendingSummary = t(pending.length === 1 ? "sync.pendingOne" : "sync.pendingMany", {
    count: pending.length,
    time: formatShort(totalSeconds),
  });

  return (
    <div className="sync-bar">
      <div className="sync-info">
        <div className="sync-week">{weekText}</div>
        {pending.length > 0 ? (
          <div className="sync-pending">
            {t("sync.pendingDetail", { summary: pendingSummary, breakdown })}
          </div>
        ) : (
          <span className="sync-info-empty">
            <Icon name="check-circle" size={15} />
            {t("sync.allSynced")}
          </span>
        )}
        {lastError && <div className="error-box">{lastError}</div>}
        {hasErrors && (
          <div className="error-box">
            {t("sync.itemErrors", { errors: Object.values(itemErrors).join(" · ") })}
          </div>
        )}
      </div>
      <button
        className="btn-sync"
        disabled={pending.length === 0 || syncing}
        onClick={onReview}
      >
        <Icon name="send" size={14} />
        {t("sync.review")}
      </button>
    </div>
  );
}
