import { useEffect, useState } from "react";
import type { AppMode } from "../electron/types";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TimesheetScreen } from "./screens/TimesheetScreen";

type Account = { company: string; userId: string };

export function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [mode, setMode] = useState<AppMode>({ demo: false, locked: false, fixedCompany: "" });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    Promise.all([window.itm.getStoredAccount(), window.itm.getMode()]).then(([acc, m]) => {
      setAccount(acc);
      setMode(m);
      document.title = m.demo ? "ITM Platform Timesheet (DEMO)" : "ITM Platform Timesheet";
      setChecking(false);
    });
  }, []);

  if (checking) return <div className="loading-state full-page">Cargando…</div>;

  if (!account) {
    return <SettingsScreen mode={mode} onConnected={setAccount} />;
  }

  return <TimesheetScreen account={account} mode={mode} onLogout={() => setAccount(null)} />;
}
