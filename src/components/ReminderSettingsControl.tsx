import { useEffect, useState } from "react";
import type { ReminderSettings } from "../../electron/types";

export function ReminderSettingsControl() {
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

  const label = !settings
    ? "Recordatorios"
    : settings.enabled || settings.activeCheckEnabled
    ? "🔔 Recordatorios"
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
          <label className="reminder-checkbox">
            <input
              type="checkbox"
              checked={draftActiveEnabled}
              onChange={(e) => setDraftActiveEnabled(e.target.checked)}
            />
            Preguntarme si sigo trabajando mientras haya un temporizador activo
          </label>
          <label className="reminder-interval">
            Cada
            <input
              type="number"
              min={1}
              value={draftActiveInterval}
              onChange={(e) => setDraftActiveInterval(e.target.value)}
              disabled={!draftActiveEnabled}
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
