import { useState } from "react";
import type { WorkItem } from "../../electron/types";
import type { TaskRef } from "../hooks/useTimers";
import { useI18n } from "../i18n";
import type { MessageKey } from "../../electron/i18n";
import { Icon } from "./Icon";
import {
  formatClock,
  formatDayShort,
  formatShort,
  hhmmToSeconds,
  secondsToHHMM,
  todayAtTime,
  timeOfDay,
} from "../timeFormat";

interface Props {
  workItem: WorkItem;
  entityId: number;
  projectName: string;
  selectedDate: string;
  isToday: boolean;
  isRunning: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  comment: string;
  isFavorite: boolean;
  onToggleFavorite: (workItemId: number) => void;
  onStart: (task: TaskRef, date: string) => { ok: boolean; reason?: string };
  onPause: (workItemId: number) => void;
  onAddManual: (task: TaskRef, seconds: number, date: string) => { ok: boolean; reason?: string };
  onEditAccumulated: (workItemId: number, seconds: number) => { ok: boolean };
  onSetComment: (workItemId: number, comment: string) => void;
  onAdjustStart: (workItemId: number, newStartedAt: number) => { ok: boolean };
}

export function TaskRow({
  workItem,
  entityId,
  projectName,
  selectedDate,
  isToday,
  isRunning,
  startedAt,
  elapsedSeconds,
  comment,
  isFavorite,
  onToggleFavorite,
  onStart,
  onPause,
  onAddManual,
  onEditAccumulated,
  onSetComment,
  onAdjustStart,
}: Props) {
  const { t, locale } = useI18n();
  const [warning, setWarning] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [noteDraft, setNoteDraft] = useState(comment);
  const [editingStart, setEditingStart] = useState(false);
  const [startValue, setStartValue] = useState("");
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountValue, setAmountValue] = useState("");

  const dayEntry = workItem.TimeEntries.find((t) => t.Date === selectedDate);
  const reportedSeconds = hhmmToSeconds(dayEntry?.ReportedHours);
  const canTrackTime = dayEntry?.TimeEntryAllowed !== false;
  const dayLabel = isToday ? t("header.today") : formatDayShort(selectedDate, locale);
  const taskRef: TaskRef = {
    workItemId: workItem.WorkItemId,
    entityId,
    taskName: workItem.Name,
    projectName,
  };

  function handleToggle() {
    if (isRunning) {
      onPause(workItem.WorkItemId);
      return;
    }
    const result = onStart(taskRef, selectedDate);
    setWarning(result.ok ? null : staleMessage(t, result.reason));
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const seconds = hhmmToSeconds(manualValue);
    if (seconds <= 0) return;
    const result = onAddManual(taskRef, seconds, selectedDate);
    if (result.ok) {
      setManualValue("");
      setShowManual(false);
      setWarning(null);
    } else {
      setWarning(staleMessage(t, result.reason));
    }
  }

  function handleNoteBlur() {
    if (noteDraft !== comment) onSetComment(workItem.WorkItemId, noteDraft);
  }

  function openAmountEditor() {
    setAmountValue(secondsToHHMM(elapsedSeconds));
    setEditingAmount(true);
  }

  function handleAmountSubmit(e: React.FormEvent) {
    e.preventDefault();
    const seconds = hhmmToSeconds(amountValue);
    const result = onEditAccumulated(workItem.WorkItemId, seconds);
    if (result.ok) {
      setEditingAmount(false);
      setWarning(null);
    } else {
      setWarning(t("task.error.amount"));
    }
  }

  function openStartEditor() {
    setStartValue(startedAt ? timeOfDay(startedAt) : "");
    setEditingStart(true);
  }

  function handleStartSubmit(e: React.FormEvent) {
    e.preventDefault();
    const epoch = todayAtTime(startValue);
    if (epoch === null) return;
    const result = onAdjustStart(workItem.WorkItemId, epoch);
    if (result.ok) {
      setEditingStart(false);
      setWarning(null);
    } else {
      setWarning(t("task.error.start"));
    }
  }

  return (
    <div className={`task-row ${isRunning ? "running" : ""}`}>
      <div className="task-row-main">
        <div className="task-name-row">
          <button
            className={`btn-favorite ${isFavorite ? "active" : ""}`}
            onClick={() => onToggleFavorite(workItem.WorkItemId)}
            title={isFavorite ? t("task.favorite.remove") : t("task.favorite.add")}
            aria-pressed={isFavorite}
          >
            <Icon name="star" size={16} filled={isFavorite} />
          </button>
          <div className="task-name" title={workItem.WorkItemNo}>
            {workItem.Name}
          </div>
        </div>
        <div className="task-meta">
          {t("task.reported", { day: dayLabel, time: formatShort(reportedSeconds) })}
          {elapsedSeconds > 0 && t("task.unsentSuffix", { time: formatShort(elapsedSeconds) })}
        </div>
        {warning && <div className="task-warning">{warning}</div>}
        {!canTrackTime && !isRunning && (
          <div className="task-warning">{t("task.noTimeAllowed")}</div>
        )}

        {isRunning &&
          startedAt &&
          (editingStart ? (
            <form className="start-edit-form" onSubmit={handleStartSubmit}>
              <span>{t("task.startLabel")}</span>
              <input
                autoFocus
                type="time"
                className="start-edit-input"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
              />
              <button type="submit">{t("common.ok")}</button>
              <button type="button" className="btn-link" onClick={() => setEditingStart(false)}>
                {t("common.cancel")}
              </button>
            </form>
          ) : (
            <button className="btn-start-edit-toggle" onClick={openStartEditor}>
              {t("task.startedAt", { time: timeOfDay(startedAt) })}
            </button>
          ))}

        {elapsedSeconds > 0 && (
          <input
            className="note-input"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder={dayEntry?.UserComments || t("task.notePlaceholder")}
          />
        )}

        {showManual ? (
          <form className="manual-entry-form" onSubmit={handleManualSubmit}>
            <input
              autoFocus
              className="manual-entry-input"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder={t("task.manualPlaceholder")}
            />
            <button type="submit">{t("task.manualAdd")}</button>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setShowManual(false);
                setManualValue("");
              }}
            >
              {t("common.cancel")}
            </button>
          </form>
        ) : (
          <button className="btn-manual-toggle" onClick={() => setShowManual(true)}>
            <Icon name="plus" size={13} />
            {t("task.manualToggle")}
          </button>
        )}
      </div>
      <div className="task-row-timer">
        {editingAmount ? (
          <form className="amount-edit-form" onSubmit={handleAmountSubmit}>
            <input
              autoFocus
              type="text"
              className="amount-edit-input"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              placeholder={t("task.manualPlaceholder")}
            />
            <button type="submit">{t("common.ok")}</button>
            <button type="button" className="btn-link" onClick={() => setEditingAmount(false)}>
              {t("common.cancel")}
            </button>
          </form>
        ) : (
          <span className="timer-clock">{formatClock(elapsedSeconds)}</span>
        )}
        {!isRunning && elapsedSeconds > 0 && !editingAmount && (
          <button className="btn-edit-amount" onClick={openAmountEditor}>
            <Icon name="edit" size={12} />
            {t("task.edit")}
          </button>
        )}
        {isToday && (
          <button
            className={isRunning ? "btn-pause" : "btn-start"}
            onClick={handleToggle}
            disabled={!isRunning && !canTrackTime}
          >
            <Icon name={isRunning ? "pause" : "play"} size={13} filled />
            {isRunning ? t("task.pause") : t("task.start")}
          </button>
        )}
      </div>
    </div>
  );
}

function staleMessage(t: (key: MessageKey) => string, reason?: string): string {
  return reason === "stale-date" ? t("task.error.stale") : t("task.error.generic");
}
