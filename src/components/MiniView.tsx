import type { useTimers } from "../hooks/useTimers";
import { formatClock } from "../timeFormat";
import { BrandMark, Icon } from "./Icon";

interface Props {
  timers: ReturnType<typeof useTimers>;
  onExit: () => void;
}

export function MiniView({ timers, onExit }: Props) {
  const running = Object.values(timers.timers).filter((t) => t.running);

  return (
    <div className="mini-view">
      <div className="mini-header">
        <span className="mini-title">
          <BrandMark size={20} />
          Timesheet
        </span>
        <button className="header-btn" onClick={onExit}>
          <Icon name="maximize-2" size={13} />
          Vista normal
        </button>
      </div>
      <div className="mini-list">
        {running.length === 0 ? (
          <div className="mini-empty">No hay temporizadores activos.</div>
        ) : (
          running.map((t) => (
            <div key={t.workItemId} className="mini-task">
              <div className="mini-task-info">
                <div className="mini-task-name" title={t.taskName}>
                  {t.taskName}
                </div>
                <div className="mini-task-project" title={t.projectName}>
                  {t.projectName}
                </div>
              </div>
              <span className="mini-clock">{formatClock(timers.getElapsedSeconds(t.workItemId))}</span>
              <button className="btn-pause mini-stop" onClick={() => timers.pause(t.workItemId)}>
                Detener
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
