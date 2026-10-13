import { parseDurationResult } from "../duration";
import { useI18n } from "../i18n";
import { secondsToHHMM } from "../timeFormat";

interface Props {
  /** Texto que el usuario ha escrito en el cuadro de duración. */
  value: string;
  /** true si 0 es un valor válido (p. ej. al corregir un tiempo para vaciarlo). */
  allowZero?: boolean;
  /** Muestra el aviso aunque el cuadro esté vacío (tras intentar enviar sin escribir nada). */
  force?: boolean;
}

/** Debajo de un cuadro de duración: cómo se ha entendido lo escrito (en h:mm) o por qué no se entiende. */
export function DurationHint({ value, allowZero = false, force = false }: Props) {
  const { t } = useI18n();
  if (!value.trim() && !force) return null;
  const result = parseDurationResult(value);
  if (!result.ok) {
    // El límite de 24 h tiene su propio mensaje; lo demás es «no se entiende» (o vacío tras intentar añadir).
    return (
      <div className="duration-hint invalid">
        {result.reason === "too-long" ? t("duration.tooLong") : t("duration.invalid")}
      </div>
    );
  }
  const seconds = result.seconds;
  if (seconds === 0 && !allowZero) {
    return <div className="duration-hint invalid">{t("duration.zero")}</div>;
  }
  return <div className="duration-hint">{t("duration.preview", { time: secondsToHHMM(seconds) })}</div>;
}
