import { useEffect, useState } from "react";
import type { AutoLaunchSettings } from "../../electron/types";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";

export function AutoLaunchControl() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<AutoLaunchSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.itm.getAutoLaunch().then(setSettings);
  }, []);

  async function handleToggle(enabled: boolean) {
    setSaving(true);
    try {
      setSettings(await window.itm.setAutoLaunch(enabled));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reminder-control">
      <button
        className={`header-btn icon-only ${settings?.enabled ? "on" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title={t("autoLaunch.title")}
      >
        <Icon name="power" />
        <span className="lbl">{t("autoLaunch.title")}</span>
      </button>
      {open && settings && (
        <div className="reminder-panel">
          <label className="reminder-checkbox">
            <input
              type="checkbox"
              checked={settings.enabled}
              disabled={!settings.supported || saving}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            {t("autoLaunch.checkbox")}
          </label>
          <p className="reminder-hint">
            {settings.supported ? t("autoLaunch.hintOn") : t("autoLaunch.hintUnsupported")}
          </p>
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
