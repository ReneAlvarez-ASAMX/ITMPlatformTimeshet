import { useEffect, useState } from "react";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TimesheetScreen } from "./screens/TimesheetScreen";

type Account = { company: string; userId: string };

export function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    window.itm.getStoredAccount().then((acc) => {
      setAccount(acc);
      setChecking(false);
    });
  }, []);

  if (checking) return <div className="loading-state full-page">Cargando…</div>;

  if (!account) {
    return <SettingsScreen onConnected={setAccount} />;
  }

  return <TimesheetScreen account={account} onLogout={() => setAccount(null)} />;
}
