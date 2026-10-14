import { useCallback, useEffect, useState } from "react";
import type { useTimers } from "../hooks/useTimers";
import type { PendingItem } from "../hooks/useSync";
import { fetchExisting } from "../hooks/useSync";
import type { ExistingHours } from "../existingHours";
import { useI18n } from "../i18n";
import { formatDayShort, formatShort, secondsToHHMM, todayStr } from "../timeFormat";
import { parseDuration } from "../duration";
import { mergeComments } from "../timerLogic";
import { DurationHint } from "./DurationHint";

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
  // Lo ya reportado, consultado fecha por fecha. Si una fecha falla, las filas se muestran igualmente
  // (para poder editarlas o descartarlas) y solo las de esa fecha quedan sin poder enviarse.
  const [lookup, setLookup] = useState<ExistingHours | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    setLookup(null);
    if (pending.length === 0) {
      setLookup({ existing: new Map(), comments: new Map(), failed: new Map() });
      return;
    }
    fetchExisting(pending.map((p) => p.date))
      .then(setLookup)
      .catch((err) => {
        setLookup({ existing: new Map(), comments: new Map(), failed: new Map() });
        setLoadError(err?.message ?? t("review.loadError"));
      });
    // Se consulta al abrir el panel (y al reintentar); los importes se recalculan localmente al editar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const existingMap = lookup?.existing ?? null;
  const failedDates = lookup?.failed ?? new Map<string, string>();
  const sendableCount = pending.filter((p) => !failedDates.has(p.date)).length;

  return (
    <div className="review-backdrop" onClick={onCancel}>
      <div className="review-panel" onClick={(e) => e.stopPropagation()}>
        <div className="review-header">
          <h2>{t("review.title")}</h2>
          <button className="btn-link" onClick={onCancel}>
            {t("common.close")}
          </button>
        </div>

        {lookup === null && <div className="loading-state">{t("review.loading")}</div>}
        {loadError && <div className="error-box">{loadError}</div>}
        {failedDates.size > 0 && (
          <div className="error-box">
            <span>{t("review.partialWarning")}</span>
            <button type="button" className="btn-link" onClick={load}>
              {t("review.retry")}
            </button>
          </div>
        )}

        {lookup !== null && pending.length === 0 && (
          <div className="empty-state">{t("review.empty")}</div>
        )}

        {/* Las filas se muestran siempre, aunque la consulta haya fallado: así siempre se puede descartar. */}
        {lookup !== null && pending.length > 0 && (
          <div className="review-list">
            {pending.map((item) => {
              const key = `${item.workItemId}_${item.date}`;
              const existingSeconds = existingMap?.get(key) ?? 0;
              const isRunning = Boolean(timers.timers[String(item.workItemId)]?.running);
              const dateError = failedDates.get(item.date);
              return (
                <ReviewRow
                  key={key}
                  item={item}
                  existingSeconds={existingSeconds}
                  existingUnknown={dateError !== undefined}
                  existingComment={lookup.comments.get(key) ?? ""}
                  isRunning={isRunning}
                  error={
                    itemErrors[item.workItemId] ??
                    (dateError !== undefined
                      ? t("review.dateError", { date: item.date, detail: dateError })
                      : undefined)
                  }
                  onEditSeconds={(seconds) => timers.setAccumulatedSeconds(item.workItemId, seconds)}
                  onEditComment={(comment) => timers.setComment(item.workItemId, comment)}
                  onEditSegmentNote={(index, note) => timers.setSegmentNote(item.workItemId, index, note)}
                  onDiscard={() => timers.discard(item.workItemId)}
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
            disabled={syncing || sendableCount === 0 || lookup === null}
          >
            {syncing ? t("review.sending") : t("review.confirm", { count: sendableCount })}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewRowProps {
  item: PendingItem;
  existingSeconds: number;
  /** true si no se pudo consultar lo ya reportado de esa fecha. */
  existingUnknown: boolean;
  /** Nota que ITM Platform ya tiene para esa tarea y fecha. */
  existingComment: string;
  isRunning: boolean;
  error?: string;
  onEditSeconds: (seconds: number) => void;
  onEditComment: (comment: string) => void;
  onEditSegmentNote: (index: number, note: string) => void;
  onDiscard: () => void;
}

function ReviewRow({
  item,
  existingSeconds,
  existingUnknown,
  existingComment,
  isRunning,
  error,
  onEditSeconds,
  onEditComment,
  onEditSegmentNote,
  onDiscard,
}: ReviewRowProps) {
  const { t, locale } = useI18n();
  const [hoursDraft, setHoursDraft] = useState(secondsToHHMM(item.seconds));
  const [noteDraft, setNoteDraft] = useState(item.draft);

  useEffect(() => setHoursDraft(secondsToHHMM(item.seconds)), [item.seconds]);
  useEffect(() => setNoteDraft(item.draft), [item.draft]);

  function commitHours() {
    const seconds = parseDuration(hoursDraft);
    if (seconds === null) {
      // No es válido (no se entiende o supera 24 h): no se aplica ni se pone el tiempo a cero.
      // El texto se queda a la vista con su aviso en rojo para poder corregirlo.
      return;
    }
    setHoursDraft(secondsToHHMM(seconds));
    if (seconds !== Math.round(item.seconds / 60) * 60) onEditSeconds(seconds);
  }

  function commitNote() {
    if (noteDraft !== item.draft) onEditComment(noteDraft);
  }

  const totalSeconds = existingSeconds + item.seconds;
  // Lo que quedará en la nota de ITM Platform: lo que ya tenga + las notas nuevas (nunca se reemplaza).
  const finalNote = existingUnknown ? item.note : mergeComments(existingComment, item.note);

  function handleDiscard() {
    const message = t("review.discardConfirm", {
      time: formatShort(item.seconds),
      task: item.taskName,
      date: formatDayShort(item.date, locale),
    });
    if (window.confirm(message)) onDiscard();
  }

  return (
    <div className="review-row">
      <div className="review-row-info">
        <div className="review-task-name">{item.taskName}</div>
        <div className="review-task-meta">
          {item.projectName} · {formatDayShort(item.date, locale)}
          {!existingUnknown && ` · ${t("review.alreadyReported", { time: formatShort(existingSeconds) })}`}
        </div>
        {error && <div className="task-warning">{error}</div>}
        {finalNote && (
          <div className="review-note-preview">
            <span className="notes-label">{t("review.noteToSend")}</span>
            <pre>{finalNote}</pre>
          </div>
        )}
        {item.date !== todayStr() && (
          <div className="review-date-warning">
            {t("review.otherDate", { date: formatDayShort(item.date, locale) })}
          </div>
        )}
      </div>
      <div className="review-row-fields">
        <label className="review-field">
          <span>{t("review.pending")}</span>
          {isRunning ? (
            <span className="review-running-hint">{t("review.running", { time: formatShort(item.seconds) })}</span>
          ) : (
            <span className="review-hours-box">
              <input
                className="review-hours-input"
                value={hoursDraft}
                onChange={(e) => setHoursDraft(e.target.value)}
                onBlur={commitHours}
              />
              {parseDuration(hoursDraft) === null && <DurationHint value={hoursDraft} allowZero force />}
            </span>
          )}
        </label>
        {item.segmentNotes.length > 0 && (
          <div className="review-segments">
            <span className="notes-label">{t("review.savedNotes")}</span>
            {item.segmentNotes.map((s) => (
              <SegmentNoteInput
                key={s.index}
                note={s.note}
                seconds={s.seconds}
                onCommit={(note) => onEditSegmentNote(s.index, note)}
              />
            ))}
          </div>
        )}
        <textarea
          className="review-note-input"
          rows={2}
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={commitNote}
          placeholder={item.segmentNotes.length > 0 ? t("review.newNote") : t("notes.placeholder")}
        />
        {!existingUnknown && (
          <div className="review-total">{t("review.total", { time: formatShort(totalSeconds) })}</div>
        )}
        <button type="button" className="btn-discard" onClick={handleDiscard} disabled={isRunning}>
          {t("review.discard")}
        </button>
      </div>
    </div>
  );
}

/** Nota de un tramo ya cerrado, editable; el tiempo parcial se muestra aparte y se añade solo al enviar. */
function SegmentNoteInput({
  note,
  seconds,
  onCommit,
}: {
  note: string;
  seconds: number;
  onCommit: (note: string) => void;
}) {
  const [draft, setDraft] = useState(note);
  useEffect(() => setDraft(note), [note]);
  return (
    <div className="review-segment">
      <textarea
        className="review-note-input"
        rows={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== note && onCommit(draft)}
      />
      <span className="review-segment-time">({formatShort(Math.max(60, seconds))})</span>
    </div>
  );
}
