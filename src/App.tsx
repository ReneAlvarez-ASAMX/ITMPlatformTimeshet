import { useCallback, useEffect, useState } from "react";
import type { AppMode } from "../electron/types";
import { DEFAULT_LANGUAGE } from "../electron/i18n";
import type { Language } from "../electron/i18n";
import { I18nProvider, useI18n } from "./i18n";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TimesheetScreen } from "./screens/TimesheetScreen";

type Account = { company: string; userId: string };

export function App() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // El idioma es el que el usuario tiene definido en "Mi perfil" de ITM Platform.
  const refreshLanguage = useCallback(async () => {
    setLanguage(await window.itm.refreshLanguage());
  }, []);

  useEffect(() => {
    // Primero el último idioma conocido (sin esperar a la red) y después el actual del perfil.
    window.itm.getLanguage().then(setLanguage);
    refreshLanguage();
  }, [refreshLanguage]);

  return (
    <I18nProvider language={language} refreshLanguage={refreshLanguage}>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { t, refreshLanguage } = useI18n();
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

  if (checking) return <div className="loading-state full-page">{t("app.loading")}</div>;

  if (!account) {
    return (
      <SettingsScreen
        mode={mode}
        onConnected={(acc) => {
          setAccount(acc);
          // Tras iniciar sesión se lee el idioma del perfil de este usuario.
          refreshLanguage();
        }}
      />
    );
  }

  return <TimesheetScreen account={account} mode={mode} onLogout={() => setAccount(null)} />;
}
