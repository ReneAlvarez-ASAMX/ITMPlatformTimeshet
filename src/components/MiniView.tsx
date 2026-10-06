import type { useTimers } from "../hooks/useTimers";
import { useI18n } from "../i18n";
import { formatClock } from "../timeFormat";
import { BrandMark, Icon } from "./Icon";

interface Props {
  timers: ReturnType<typeof useTimers>;
  onExit: () => void;
}

export function MiniView({ timers, onExit }: Props) {
  const { t } = useI18n();
  const running = Object.values(timers.timers).filter((timer) => timer.running);

  return (
    <div className="mini-view">
      <div className="mini-header">
        <span className="mini-title">
          <BrandMark size={20} />
          Timesheet
        </span>
        <button className="header-btn" onClick={onExit}>
          <Icon name="maximize-2" size={13} />
          {t("mini.normalView")}
        </button>
      </div>
      <div className="mini-list">
        {running.length === 0 ? (
          <div className="mini-empty">{t("mini.empty")}</div>
        ) : (
          running.map((timer) => (
            <div key={timer.workItemId} className="mini-task">
              <div className="mini-task-info">
                <div className="mini-task-name" title={timer.taskName}>
                  {timer.taskName}
                </div>
                <div className="mini-task-project" title={timer.projectName}>
                  {timer.projectName}
                </div>
              </div>
              <span className="mini-clock">
                {formatClock(timers.getElapsedSeconds(timer.workItemId))}
              </span>
              <button
                className="btn-pause mini-stop"
                onClick={() => timers.pause(timer.workItemId)}
              >
                {t("mini.stop")}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
