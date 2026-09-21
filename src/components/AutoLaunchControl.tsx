import { useEffect, useState } from "react";
import type { AutoLaunchSettings } from "../../electron/types";

export function AutoLaunchControl() {
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
      <button className="btn-link" onClick={() => setOpen((v) => !v)}>
        {settings?.enabled ? "🚀 Inicio automático" : "Inicio automático"}
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
            Iniciar la aplicación al iniciar sesión en el sistema
          </label>
          <p className="reminder-hint">
            {settings.supported
              ? "Al arrancar con el sistema, la app queda en la bandeja hasta que la abras."
              : "Solo disponible en la aplicación instalada, no en modo desarrollo."}
          </p>
          <div className="reminder-panel-actions">
            <button type="button" className="btn-link" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
