import type { TimeReportGroup } from "../../electron/types";
import type { TaskRef, useTimers } from "../hooks/useTimers";
import { formatDayShort, formatShort, hhmmToSeconds } from "../timeFormat";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";
import { TaskRow } from "./TaskRow";

interface Props {
  projects: TimeReportGroup[];
  timers: ReturnType<typeof useTimers>;
  forceExpanded?: boolean;
  collapsed: Record<number, boolean>;
  onToggleProject: (entityId: number) => void;
  selectedDate: string;
  isToday: boolean;
  onReviewPending: () => void;
}

/**
 * Totales de un proyecto: lo reportado el día seleccionado, lo reportado en toda la semana
 * mostrada y el tiempo pendiente de enviar (de cualquier fecha, igual que la barra inferior).
 */
function projectTotals(
  project: TimeReportGroup,
  getElapsedSeconds: (workItemId: number) => number,
  selectedDate: string
): { daySeconds: number; weekSeconds: number; pendingSeconds: number } {
  let daySeconds = 0;
  let weekSeconds = 0;
  let pendingSeconds = 0;
  for (const wi of project.WorkItems) {
    for (const entry of wi.TimeEntries) {
      const seconds = hhmmToSeconds(entry.ReportedHours);
      weekSeconds += seconds;
      if (entry.Date === selectedDate) daySeconds += seconds;
    }
    pendingSeconds += getElapsedSeconds(wi.WorkItemId);
  }
  return { daySeconds, weekSeconds, pendingSeconds };
}

export function TaskList({
  projects,
  timers,
  forceExpanded,
  collapsed,
  onToggleProject,
  selectedDate,
  isToday,
  onReviewPending,
}: Props) {
  const { t, locale } = useI18n();
  const dayLabel = isToday ? t("header.today") : formatDayShort(selectedDate, locale);
  if (projects.length === 0) {
    return <div className="empty-state">{t("list.empty")}</div>;
  }

  return (
    <div className="task-list">
      {projects.map((project) => {
        const isCollapsed = !forceExpanded && Boolean(collapsed[project.EntityId]);
        const { daySeconds, weekSeconds, pendingSeconds } = projectTotals(
          project,
          timers.getElapsedSeconds,
          selectedDate
        );
        return (
          <div key={project.EntityId} className="project-group">
            <button
              className="project-title"
              onClick={() => onToggleProject(project.EntityId)}
              aria-expanded={!isCollapsed}
            >
              <Icon name="chevron-down" size={14} className={`chevron ${isCollapsed ? "collapsed" : ""}`} />
              {project.Name}
              <span className="project-total">
                {t("list.projectDay", { day: dayLabel, time: formatShort(daySeconds) })}
                {" · "}
                {t("list.projectWeek", { time: formatShort(weekSeconds) })}
                {pendingSeconds > 0 && (
                  <>
                    {" · "}
                    {t("list.projectUnsent", { time: formatShort(pendingSeconds) })}
                  </>
                )}
              </span>
              <span className="project-count">{project.WorkItems.length}</span>
            </button>
            {!isCollapsed &&
              project.WorkItems.map((wi) => {
                const timer = timers.timers[String(wi.WorkItemId)];
                return (
                  <TaskRow
                    key={wi.WorkItemId}
                    workItem={wi}
                    entityId={project.EntityId}
                    projectName={project.Name}
                    selectedDate={selectedDate}
                    isToday={isToday}
                    isRunning={Boolean(timer?.running)}
                    startedAt={timer?.startedAt ?? null}
                    elapsedSeconds={timers.getElapsedSeconds(wi.WorkItemId)}
                    pendingDate={timer?.date ?? null}
                    comment={timer?.comment ?? ""}
                    isFavorite={timers.isFavorite(wi.WorkItemId)}
                    onToggleFavorite={(id) => timers.toggleFavorite(id)}
                    onStart={(task: TaskRef, date: string) => timers.start(task, date)}
                    onPause={(id) => timers.pause(id)}
                    onAddManual={(task, seconds, date) => timers.addManualSeconds(task, seconds, date)}
                    onEditAccumulated={(id, seconds) => timers.setAccumulatedSeconds(id, seconds)}
                    onSetComment={(id, comment) => timers.setComment(id, comment)}
                    onAdjustStart={(id, newStartedAt) => timers.adjustStartTime(id, newStartedAt)}
                    onReviewPending={onReviewPending}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
