import { useEffect, useState } from "react";
import type { useTimers } from "../hooks/useTimers";
import type { PendingItem } from "../hooks/useSync";
import { fetchExistingSeconds } from "../hooks/useSync";
import { useI18n } from "../i18n";
import { formatDayShort, formatShort, hhmmToSeconds, secondsToHHMM } from "../timeFormat";

interface Props {
  pending: PendingItem[];
  timers: ReturnType<typeof useTimers>;
  syncing: boolean;
  lastError: string | null;
  itemErrors: Record<number, string>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SyncReviewPanel({
  pending,
  timers,
  syncing,
  lastError,
  itemErrors,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const [existingMap, setExistingMap] = useState<Map<string, number> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (pending.length === 0) {
      setExistingMap(new Map());
      return;
    }
    const dates = pending.map((p) => p.date).sort();
    fetchExistingSeconds(dates[0], dates[dates.length - 1])
      .then(setExistingMap)
      .catch((err) => setLoadError(err?.message ?? t("review.loadError")));
    // Se consulta una sola vez, al abrir el panel; los importes se recalculan localmente al editar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="review-backdrop" onClick={onCancel}>
      <div className="review-panel" onClick={(e) => e.stopPropagation()}>
        <div className="review-header">
          <h2>{t("review.title")}</h2>
          <button className="btn-link" onClick={onCancel}>
            {t("common.close")}
          </button>
        </div>

        {existingMap === null && !loadError && (
          <div className="loading-state">{t("review.loading")}</div>
        )}
        {loadError && <div className="error-box">{loadError}</div>}

        {existingMap !== null && pending.length === 0 && (
          <div className="empty-state">{t("review.empty")}</div>
        )}

        {existingMap !== null && pending.length > 0 && (
          <div className="review-list">
            {pending.map((item) => {
              const key = `${item.workItemId}_${item.date}`;
              const existingSeconds = existingMap.get(key) ?? 0;
              const isRunning = Boolean(timers.timers[String(item.workItemId)]?.running);
              return (
                <ReviewRow
                  key={key}
                  item={item}
                  existingSeconds={existingSeconds}
                  isRunning={isRunning}
                  error={itemErrors[item.workItemId]}
                  onEditSeconds={(seconds) => timers.setAccumulatedSeconds(item.workItemId, seconds)}
                  onEditComment={(comment) => timers.setComment(item.workItemId, comment)}
                />
              );
            })}
          </div>
        )}

        {lastError && <div className="error-box">{lastError}</div>}

        <div className="review-actions">
          <button className="btn-link" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            className="btn-sync"
            onClick={onConfirm}
            disabled={syncing || pending.length === 0 || existingMap === null}
          >
            {syncing ? t("review.sending") : t("review.confirm", { count: pending.length })}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewRowProps {
  item: PendingItem;
  existingSeconds: number;
  isRunning: boolean;
  error?: string;
  onEditSeconds: (seconds: number) => void;
  onEditComment: (comment: string) => void;
}

function ReviewRow({ item, existingSeconds, isRunning, error, onEditSeconds, onEditComment }: ReviewRowProps) {
  const { t, locale } = useI18n();
  const [hoursDraft, setHoursDraft] = useState(secondsToHHMM(item.seconds));
  const [noteDraft, setNoteDraft] = useState(item.comment);

  useEffect(() => setHoursDraft(secondsToHHMM(item.seconds)), [item.seconds]);
  useEffect(() => setNoteDraft(item.comment), [item.comment]);

  function commitHours() {
    const seconds = hhmmToSeconds(hoursDraft);
    if (seconds !== item.seconds) onEditSeconds(seconds);
  }

  function commitNote() {
    if (noteDraft !== item.comment) onEditComment(noteDraft);
  }

  const totalSeconds = existingSeconds + item.seconds;

  return (
    <div className="review-row">
      <div className="review-row-info">
        <div className="review-task-name">{item.taskName}</div>
        <div className="review-task-meta">
          {item.projectName} · {formatDayShort(item.date, locale)} · {t("review.alreadyReported", { time: formatShort(existingSeconds) })}
        </div>
        {error && <div className="task-warning">{error}</div>}
      </div>
      <div className="review-row-fields">
        <label className="review-field">
          <span>{t("review.pending")}</span>
          {isRunning ? (
            <span className="review-running-hint">{t("review.running", { time: formatShort(item.seconds) })}</span>
          ) : (
            <input
              className="review-hours-input"
              value={hoursDraft}
              onChange={(e) => setHoursDraft(e.target.value)}
              onBlur={commitHours}
            />
          )}
        </label>
        <input
          className="review-note-input"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={commitNote}
          placeholder={t("task.notePlaceholder")}
        />
        <div className="review-total">{t("review.total", { time: formatShort(totalSeconds) })}</div>
      </div>
    </div>
  );
}
