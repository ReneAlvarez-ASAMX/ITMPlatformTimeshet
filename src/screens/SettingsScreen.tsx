import { useState } from "react";
import type { AppMode } from "../../electron/types";
import { BrandMark } from "../components/Icon";
import { useSecretTaps } from "../hooks/useSecretTaps";
import { switchMode } from "../modeSwitch";
import { PoweredBy } from "../components/PoweredBy";

interface Props {
  mode: AppMode;
  onConnected: (account: { company: string; userId: string }) => void;
}

export function SettingsScreen({ mode, onConnected }: Props) {
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
      setError(err?.message ?? "No se pudo conectar con ITM Platform.");
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
        <h1>Conectar con ITM Platform</h1>
        {mode.demo ? (
          <p className="hint">
            Entorno de demostración <strong>{mode.fixedCompany}</strong>. Introduce la API Key de
            tu usuario en este entorno.
          </p>
        ) : (
          <p className="hint">
            Introduce el identificador de tu empresa (el que usas para acceder a ITM Platform)
            y tu API Key personal, disponible en tu perfil de ITM Platform.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          {!mode.demo && (
            <label>
              Empresa (company URL)
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="miempresa"
                autoFocus
              />
            </label>
          )}
          <label>
            API Key
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
            {connecting ? "Conectando…" : "Conectar"}
          </button>
        </form>
      </div>
      <PoweredBy />
    </div>
  );
}
