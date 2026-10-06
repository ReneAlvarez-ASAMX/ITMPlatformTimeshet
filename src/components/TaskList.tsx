import type { TimeReportGroup } from "../../electron/types";
import type { TaskRef, useTimers } from "../hooks/useTimers";
import { formatShort, hhmmToSeconds } from "../timeFormat";
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
}

function projectTotals(
  project: TimeReportGroup,
  getElapsedSeconds: (workItemId: number) => number
): { reportedSeconds: number; pendingSeconds: number } {
  let reportedSeconds = 0;
  let pendingSeconds = 0;
  for (const wi of project.WorkItems) {
    for (const entry of wi.TimeEntries) reportedSeconds += hhmmToSeconds(entry.ReportedHours);
    pendingSeconds += getElapsedSeconds(wi.WorkItemId);
  }
  return { reportedSeconds, pendingSeconds };
}

export function TaskList({
  projects,
  timers,
  forceExpanded,
  collapsed,
  onToggleProject,
  selectedDate,
  isToday,
}: Props) {
  if (projects.length === 0) {
    return <div className="empty-state">No se encontraron tareas para este periodo.</div>;
  }

  return (
    <div className="task-list">
      {projects.map((project) => {
        const isCollapsed = !forceExpanded && Boolean(collapsed[project.EntityId]);
        const { reportedSeconds, pendingSeconds } = projectTotals(project, timers.getElapsedSeconds);
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
                {formatShort(reportedSeconds)}
                {pendingSeconds > 0 && ` + ${formatShort(pendingSeconds)} sin enviar`}
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
                    comment={timer?.comment ?? ""}
                    isFavorite={timers.isFavorite(wi.WorkItemId)}
                    onToggleFavorite={(id) => timers.toggleFavorite(id)}
                    onStart={(task: TaskRef, date: string) => timers.start(task, date)}
                    onPause={(id) => timers.pause(id)}
                    onAddManual={(task, seconds, date) => timers.addManualSeconds(task, seconds, date)}
                    onEditAccumulated={(id, seconds) => timers.setAccumulatedSeconds(id, seconds)}
                    onSetComment={(id, comment) => timers.setComment(id, comment)}
                    onAdjustStart={(id, newStartedAt) => timers.adjustStartTime(id, newStartedAt)}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
