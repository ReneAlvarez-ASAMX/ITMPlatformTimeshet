import { useEffect, useState } from "react";
import type { ReminderSettings } from "../../electron/types";

export function ReminderSettingsControl() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [draftEnabled, setDraftEnabled] = useState(true);
  const [draftInterval, setDraftInterval] = useState("5");

  useEffect(() => {
    window.itm.getReminderSettings().then((s) => {
      setSettings(s);
      setDraftEnabled(s.enabled);
      setDraftInterval(String(s.intervalMinutes));
    });
  }, []);

  function openPanel() {
    if (settings) {
      setDraftEnabled(settings.enabled);
      setDraftInterval(String(settings.intervalMinutes));
    }
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const minutes = Math.max(1, parseInt(draftInterval, 10) || 5);
    const next: ReminderSettings = { enabled: draftEnabled, intervalMinutes: minutes };
    setSettings(next);
    await window.itm.setReminderSettings(next);
    setOpen(false);
  }

  const label = !settings
    ? "Recordatorios"
    : settings.enabled
    ? `🔔 Cada ${settings.intervalMinutes} min`
    : "🔕 Desactivados";

  return (
    <div className="reminder-control">
      <button className="btn-link" onClick={openPanel}>
        {label}
      </button>
      {open && (
        <form className="reminder-panel" onSubmit={handleSave}>
          <label className="reminder-checkbox">
            <input
              type="checkbox"
              checked={draftEnabled}
              onChange={(e) => setDraftEnabled(e.target.checked)}
            />
            Recordarme si no hay ningún temporizador activo
          </label>
          <label className="reminder-interval">
            Cada
            <input
              type="number"
              min={1}
              value={draftInterval}
              onChange={(e) => setDraftInterval(e.target.value)}
              disabled={!draftEnabled}
            />
            minutos
          </label>
          <div className="reminder-panel-actions">
            <button type="submit">Guardar</button>
            <button type="button" className="btn-link" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
