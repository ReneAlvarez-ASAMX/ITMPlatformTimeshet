import { useI18n } from "../i18n";

interface Props {
  /** Notas ya cerradas, una por línea (solo lectura): se ven, pero no se reescriben. */
  previous: string;
  /** Nota que ya tiene ITM Platform ese día (solo lectura), si la hay. */
  inItm?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Campo de nota multilínea: muestra las notas anteriores (solo lectura) encima y deja escribir
 * únicamente la nueva, que se AÑADE a las anteriores en lugar de reemplazarlas.
 */
export function NotesField({ previous, inItm, value, onChange, onBlur, placeholder, autoFocus }: Props) {
  const { t } = useI18n();
  return (
    <div className="notes-field">
      {inItm ? (
        <div className="notes-previous">
          <span className="notes-label">{t("notes.inItm")}</span>
          <pre>{inItm}</pre>
        </div>
      ) : null}
      {previous ? (
        <div className="notes-previous">
          <span className="notes-label">{t("notes.previous")}</span>
          <pre>{previous}</pre>
        </div>
      ) : null}
      <textarea
        className="note-input"
        rows={2}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder ?? t("notes.placeholder")}
      />
    </div>
  );
}
