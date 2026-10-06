import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LANGUAGE, localeFor, translate } from "../electron/i18n";
import type { Language, MessageKey } from "../electron/i18n";

type Params = Record<string, string | number>;

interface I18nValue {
  language: Language;
  /** Configuración regional para fechas ("es-ES", "en-US", "pt-BR"). */
  locale: string;
  t: (key: MessageKey, params?: Params) => string;
  /** Vuelve a leer el idioma de "Mi perfil" en ITM Platform. */
  refreshLanguage: () => Promise<void>;
}

const I18nContext = createContext<I18nValue>({
  language: DEFAULT_LANGUAGE,
  locale: localeFor(DEFAULT_LANGUAGE),
  t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
  refreshLanguage: async () => {},
});

interface ProviderProps {
  language: Language;
  refreshLanguage: () => Promise<void>;
  children: ReactNode;
}

export function I18nProvider({ language, refreshLanguage, children }: ProviderProps) {
  const value = useMemo<I18nValue>(
    () => ({
      language,
      locale: localeFor(language),
      t: (key, params) => translate(language, key, params),
      refreshLanguage,
    }),
    [language, refreshLanguage]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
