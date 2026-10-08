import { useCallback, useEffect, useMemo, useState } from "react";
import type { SendLogEntry, SendLogStatus } from "../../electron/types";
import { useI18n } from "../i18n";
import { formatDayShort, formatShort } from "../timeFormat";
import { Icon } from "./Icon";

type Period = "7" | "30" | "all";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD HH:MM:SS" de hace `days` días, comparable como texto con las fechas del registro. */
function cutoffFor(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

const minutesText = (minutes: number) => formatShort(minutes * 60);

/**
 * Informe de envíos: contenido del registro local (CSV) de todo lo enviado a ITM Platform en los
 * últimos 2 meses, para poder reconciliar con lo que figura en ITM Platform.
 */
export function SendReport({ onClose }: { onClose: () => void }) {
  const { t, locale } = useI18n();
  const [entries, setEntries] = useState<SendLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | SendLogStatus>("all");
  const [period, setPeriod] = useState<Period>("all");

  const load = useCallback(() => {
    setError(null);
    window.itm
      .getSendLog()
      .then(setEntries)
      .catch(() => setError(t("report.loadError")));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const cutoff = period === "all" ? null : cutoffFor(Number(period));
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    return entries.filter(
      (e) =>
        (status === "all" || e.status === status) &&
        (!cutoff || e.sentAt >= cutoff) &&
        (terms.length === 0 || terms.every((w) => normalize(`${e.projectName} ${e.taskName} ${e.note}`).includes(w)))
    );
  }, [entries, search, status, period]);

  const addedMinutes = filtered.filter((e) => e.status === "OK").reduce((s, e) => s + e.addedMinutes, 0);

  async function handleExport() {
    const res = await window.itm.exportSendLog();
    if (res.ok) setNotice(t("report.exported"));
  }

  return (
    <div className="review-backdrop" onClick={onClose}>
      <div className="review-panel report-panel" onClick={(e) => e.stopPropagation()}>
        <div className="review-header">
          <h2>{t("report.title")}</h2>
          <button className="btn-link" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

        <div className="report-filters">
          <input
            className="report-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("report.search")}
          />
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="7">{t("report.period.7")}</option>
            <option value="30">{t("report.period.30")}</option>
            <option value="all">{t("report.period.all")}</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as "all" | SendLogStatus)}>
            <option value="all">{t("report.status.all")}</option>
            <option value="OK">{t("report.status.OK")}</option>
            <option value="ERROR">{t("report.status.ERROR")}</option>
            <option value="UNCONFIRMED">{t("report.status.UNCONFIRMED")}</option>
          </select>
        </div>

        {error && <div className="error-box">{error}</div>}
        {entries === null && !error && <div className="loading-state">{t("app.loading")}</div>}

        {entries !== null && (
          <div className="report-table-wrap">
            {filtered.length === 0 ? (
              <div className="empty-state">{t("report.empty")}</div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>{t("report.col.sentAt")}</th>
                    <th>{t("report.col.project")}</th>
                    <th>{t("report.col.task")}</th>
                    <th>{t("report.col.workDate")}</th>
                    <th className="num">{t("report.col.existing")}</th>
                    <th className="num">{t("report.col.added")}</th>
                    <th className="num">{t("report.col.sent")}</th>
                    <th>{t("report.col.note")}</th>
                    <th>{t("report.col.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const sentDay = e.sentAt.slice(0, 10);
                    const otherDate = e.workDate !== sentDay;
                    return (
                      <tr key={`${e.batchId}-${e.taskId}-${e.workDate}`}>
                        <td title={e.sentAt}>
                          {formatDayShort(sentDay, locale)} {e.sentAt.slice(11, 16)}
                        </td>
                        <td>{e.projectName}</td>
                        <td>{e.taskName}</td>
                        <td className={otherDate ? "other-date" : ""} title={otherDate ? t("report.otherDate") : ""}>
                          {formatDayShort(e.workDate, locale)}
                        </td>
                        <td className="num">{minutesText(e.existingMinutes)}</td>
                        <td className="num">+{minutesText(e.addedMinutes)}</td>
                        <td className="num">{minutesText(e.sentMinutes)}</td>
                        <td className="note" title={e.note}>
                          {e.note}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${e.status.toLowerCase()}`}
                            title={e.status === "UNCONFIRMED" ? t("report.unconfirmedHint") : e.message}
                          >
                            {t(`report.status.${e.status}` as const)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="report-footer">
          <div className="report-summary">
            <strong>{t("report.totals", { count: filtered.length, time: formatShort(addedMinutes * 60) })}</strong>
            <span>{t("report.retention")}</span>
            {notice && <span className="report-notice">{notice}</span>}
          </div>
          <div className="report-actions">
            <button onClick={load}>
              <Icon name="refresh-cw" size={14} />
              {t("report.refresh")}
            </button>
            <button onClick={() => window.itm.revealSendLog()}>
              <Icon name="folder" size={14} />
              {t("report.reveal")}
            </button>
            <button className="btn-sync" onClick={handleExport}>
              <Icon name="download" size={14} />
              {t("report.export")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
