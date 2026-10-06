import { formatShort } from "../timeFormat";
import type { PendingItem } from "../hooks/useSync";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";

interface Props {
  pending: PendingItem[];
  syncing: boolean;
  lastError: string | null;
  itemErrors: Record<number, string>;
  onReview: () => void;
}

export function SyncBar({ pending, syncing, lastError, itemErrors, onReview }: Props) {
  const { t } = useI18n();
  const totalSeconds = pending.reduce((sum, p) => sum + p.seconds, 0);
  const hasErrors = Object.keys(itemErrors).length > 0;

  return (
    <div className="sync-bar">
      <div className="sync-info">
        {pending.length > 0 ? (
          <span>
            {t(pending.length === 1 ? "sync.pendingOne" : "sync.pendingMany", {
              count: pending.length,
              time: formatShort(totalSeconds),
            })}
          </span>
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
