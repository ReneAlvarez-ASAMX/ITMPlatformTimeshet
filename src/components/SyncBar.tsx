import { formatShort } from "../timeFormat";
import type { PendingItem } from "../hooks/useSync";

interface Props {
  pending: PendingItem[];
  syncing: boolean;
  lastError: string | null;
  itemErrors: Record<number, string>;
  onReview: () => void;
}

export function SyncBar({ pending, syncing, lastError, itemErrors, onReview }: Props) {
  const totalSeconds = pending.reduce((sum, p) => sum + p.seconds, 0);
  const hasErrors = Object.keys(itemErrors).length > 0;

  return (
    <div className="sync-bar">
      <div className="sync-info">
        {pending.length > 0 ? (
          <span>
            {pending.length} tarea{pending.length !== 1 ? "s" : ""} con {formatShort(totalSeconds)} sin
            enviar
          </span>
        ) : (
          <span className="sync-info-empty">Todo sincronizado</span>
        )}
        {lastError && <div className="error-box">{lastError}</div>}
        {hasErrors && (
          <div className="error-box">
            Algunas tareas no se pudieron enviar: {Object.values(itemErrors).join(" · ")}
          </div>
        )}
      </div>
      <button
        className="btn-sync"
        disabled={pending.length === 0 || syncing}
        onClick={onReview}
      >
        Revisar y enviar
      </button>
    </div>
  );
}
