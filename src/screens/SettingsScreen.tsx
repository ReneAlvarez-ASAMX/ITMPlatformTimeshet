import { useState } from "react";
import type { AppMode } from "../../electron/types";
import { BrandMark } from "../components/Icon";
import { PoweredBy } from "../components/PoweredBy";
import { useSecretTaps } from "../hooks/useSecretTaps";
import { useI18n } from "../i18n";
import { switchMode } from "../modeSwitch";

interface Props {
  mode: AppMode;
  onConnected: (account: { company: string; userId: string }) => void;
}

export function SettingsScreen({ mode, onConnected }: Props) {
  const { t } = useI18n();
  const [company, setCompany] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSecretTap = useSecretTaps(() => switchMode(mode.demo));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // En modo demo la empresa es fija; el proceso principal también la impone.
    const companyValue = mode.demo ? mode.fixedCompany : company.trim();
    if (!companyValue || !apiKey.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await window.itm.login({ company: companyValue, apiKey: apiKey.trim() });
      onConnected({ company: companyValue, userId: res.UserID });
    } catch (err: any) {
      setError(err?.message ?? t("settings.connectError"));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-card">
        <div className="settings-brand">
          <span className="brand-tap" onClick={onSecretTap}>
            <BrandMark size={44} />
          </span>
          <span className="settings-brand-sub">TIMESHEET</span>
          {mode.demo && <span className="demo-badge">DEMO</span>}
        </div>
        <h1>{t("settings.title")}</h1>
        <p className="hint">
          {mode.demo ? t("settings.demoHint", { company: mode.fixedCompany }) : t("settings.hint")}
        </p>
        <form onSubmit={handleSubmit}>
          {!mode.demo && (
            <label>
              {t("settings.company")}
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t("settings.companyPlaceholder")}
                autoFocus
              />
            </label>
          )}
          <label>
            {t("settings.apiKey")}
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="3140fcb4-3462-4cad-afcc-a75d266af47d"
              type="password"
              autoFocus={mode.demo}
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" disabled={connecting}>
            {connecting ? t("settings.connecting") : t("settings.connect")}
          </button>
        </form>
      </div>
      <PoweredBy />
    </div>
  );
}
