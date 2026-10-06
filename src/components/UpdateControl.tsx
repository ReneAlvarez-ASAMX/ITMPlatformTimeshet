import { useEffect, useState } from "react";
import type { UpdateStatus } from "../../electron/types";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";

export function UpdateControl() {
  const { t } = useI18n();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.itm.getUpdateStatus().then(setStatus);
    return window.itm.onUpdateStatus(setStatus);
  }, []);

  if (!status) return null;

  const updateReady = status.state === "available" || status.state === "downloaded";
  const label = updateReady
    ? t("update.available", { version: status.version ?? "" })
    : status.state === "downloading"
    ? t("update.downloading", { percent: status.percent ?? 0 })
    : `v${status.currentVersion}`;

  return (
    <div className="reminder-control">
      <button
        className={`header-btn ${updateReady ? "update-available" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {updateReady && <Icon name="arrow-up-circle" />}
        {label}
      </button>
      {open && (
        <div className="reminder-panel">
          <UpdateBody status={status} />
          <div className="reminder-panel-actions">
            <button type="button" className="btn-link" onClick={() => setOpen(false)}>
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateBody({ status }: { status: UpdateStatus }) {
  const { t } = useI18n();
  const current = (
    <p className="reminder-hint">{t("update.installed", { version: status.currentVersion })}</p>
  );

  switch (status.state) {
    case "unsupported":
      return (
        <>
          {current}
          <p className="reminder-hint">{t("update.unsupported")}</p>
        </>
      );
    case "checking":
      return (
        <>
          {current}
          <p className="reminder-hint">{t("update.checking")}</p>
        </>
      );
    case "available":
      return (
        <>
          {current}
          <p className="reminder-hint">
            {t("update.newVersion", { version: status.version ?? "" })}
          </p>
          <button type="button" onClick={() => window.itm.downloadUpdate()}>
            {t("update.download")}
          </button>
        </>
      );
    case "downloading":
      return (
        <>
          {current}
          <p className="reminder-hint">
            {t("update.downloadingVersion", {
              version: status.version ?? "",
              percent: status.percent ?? 0,
            })}
          </p>
        </>
      );
    case "downloaded":
      return (
        <>
          {current}
          <p className="reminder-hint">{t("update.ready", { version: status.version ?? "" })}</p>
          <button type="button" onClick={() => window.itm.installUpdate()}>
            {t("update.install")}
          </button>
        </>
      );
    case "error":
      return (
        <>
          {current}
          <div className="error-box">{status.error ?? t("update.errorFallback")}</div>
          <button type="button" onClick={() => window.itm.checkForUpdates()}>
            {t("common.retry")}
          </button>
        </>
      );
    case "not-available":
    case "idle":
    default:
      return (
        <>
          {current}
          {status.state === "not-available" && (
            <p className="reminder-hint">{t("update.upToDate")}</p>
          )}
          <button type="button" onClick={() => window.itm.checkForUpdates()}>
            {t("update.check")}
          </button>
        </>
      );
  }
}
