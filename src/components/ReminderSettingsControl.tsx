import { useEffect, useState } from "react";
import type { ReminderSettings } from "../../electron/types";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";

export function ReminderSettingsControl() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(true);
  const [draftInterval, setDraftInterval] = useState("5");
  const [draftActiveEnabled, setDraftActiveEnabled] = useState(true);
  const [draftActiveInterval, setDraftActiveInterval] = useState("15");

  function loadDraft(s: ReminderSettings) {
    setDraftEnabled(s.enabled);
    setDraftInterval(String(s.intervalMinutes));
    setDraftActiveEnabled(s.activeCheckEnabled);
    setDraftActiveInterval(String(s.activeCheckIntervalMinutes));
  }

  useEffect(() => {
    window.itm.getReminderSettings().then((s) => {
      setSettings(s);
      loadDraft(s);
    });
  }, []);

  function openPanel() {
    if (settings) loadDraft(settings);
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const next: ReminderSettings = {
      enabled: draftEnabled,
      intervalMinutes: Math.max(1, parseInt(draftInterval, 10) || 5),
      activeCheckEnabled: draftActiveEnabled,
      activeCheckIntervalMinutes: Math.max(1, parseInt(draftActiveInterval, 10) || 15),
    };
    setSettings(next);
    await window.itm.setReminderSettings(next);
    setOpen(false);
  }

  const anyEnabled = !settings || settings.enabled || settings.activeCheckEnabled;
  const label = anyEnabled ? t("reminders.title") : t("reminders.disabled");

  return (
    <div className="reminder-control">
      <button className="header-btn" onClick={openPanel} title={t("reminders.title")}>
        <Icon name={anyEnabled ? "bell" : "bell-off"} />
        <span className="lbl">{label}</span>
      </button>
      {open && (
        <form className="reminder-panel" onSubmit={handleSave}>
          <label className="reminder-checkbox">
            <input
              type="checkbox"
              checked={draftEnabled}
              onChange={(e) => setDraftEnabled(e.target.checked)}
            />
            {t("reminders.noTimer")}
          </label>
          <label className="reminder-interval">
            {t("reminders.every")}
            <input
              type="number"
              min={1}
              value={draftInterval}
              onChange={(e) => setDraftInterval(e.target.value)}
              disabled={!draftEnabled}
            />
            {t("reminders.minutes")}
          </label>
          <label className="reminder-checkbox">
            <input
              type="checkbox"
              checked={draftActiveEnabled}
              onChange={(e) => setDraftActiveEnabled(e.target.checked)}
            />
            {t("reminders.stillWorking")}
          </label>
          <label className="reminder-interval">
            {t("reminders.every")}
            <input
              type="number"
              min={1}
              value={draftActiveInterval}
              onChange={(e) => setDraftActiveInterval(e.target.value)}
              disabled={!draftActiveEnabled}
            />
            {t("reminders.minutes")}
          </label>
          <div className="reminder-panel-actions">
            <button type="submit">{t("common.save")}</button>
            <button type="button" className="btn-link" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
