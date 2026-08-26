import { useState } from "react";

interface Props {
  onConnected: (account: { company: string; userId: string }) => void;
}

export function SettingsScreen({ onConnected }: Props) {
  const [company, setCompany] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !apiKey.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await window.itm.login({ company: company.trim(), apiKey: apiKey.trim() });
      onConnected({ company: company.trim(), userId: res.UserID });
    } catch (err: any) {
      setError(err?.message ?? "No se pudo conectar con ITM Platform.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-card">
        <h1>Conectar con ITM Platform</h1>
        <p className="hint">
          Introduce el identificador de tu empresa (el que usas para acceder a ITM Platform)
          y tu API Key personal, disponible en tu perfil de ITM Platform.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Empresa (company URL)
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="miempresa"
              autoFocus
            />
          </label>
          <label>
            API Key
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="3140fcb4-3462-4cad-afcc-a75d266af47d"
              type="password"
            />
          </label>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" disabled={connecting}>
            {connecting ? "Conectando…" : "Conectar"}
          </button>
        </form>
      </div>
    </div>
  );
}
