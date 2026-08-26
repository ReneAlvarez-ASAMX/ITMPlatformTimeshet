import { useEffect, useState } from "react";
import type { useTimers } from "../hooks/useTimers";
import type { PendingItem } from "../hooks/useSync";
import { fetchExistingSeconds } from "../hooks/useSync";
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
      .catch((err) => setLoadError(err?.message ?? "No se pudo consultar lo ya reportado en ITM Platform."));
    // Se consulta una sola vez, al abrir el panel; los importes se recalculan localmente al editar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="review-backdrop" onClick={onCancel}>
      <div className="review-panel" onClick={(e) => e.stopPropagation()}>
        <div className="review-header">
          <h2>Revisar antes de enviar</h2>
          <button className="btn-link" onClick={onCancel}>
            Cerrar
          </button>
        </div>

        {existingMap === null && !loadError && (
          <div className="loading-state">Consultando lo ya reportado en ITM Platform…</div>
        )}
        {loadError && <div className="error-box">{loadError}</div>}

        {existingMap !== null && pending.length === 0 && (
          <div className="empty-state">No queda tiempo pendiente por enviar.</div>
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
            Cancelar
          </button>
          <button
            className="btn-sync"
            onClick={onConfirm}
            disabled={syncing || pending.length === 0 || existingMap === null}
          >
            {syncing ? "Enviando…" : `Confirmar y enviar (${pending.length})`}
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
          {formatDayShort(item.date)} · Ya reportado: {formatShort(existingSeconds)}
        </div>
        {error && <div className="task-warning">{error}</div>}
      </div>
      <div className="review-row-fields">
        <label className="review-field">
          <span>Pendiente</span>
          {isRunning ? (
            <span className="review-running-hint">{formatShort(item.seconds)} (en marcha)</span>
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
          placeholder="Nota (opcional)"
        />
        <div className="review-total">Total a enviar: {formatShort(totalSeconds)}</div>
      </div>
    </div>
  );
}
