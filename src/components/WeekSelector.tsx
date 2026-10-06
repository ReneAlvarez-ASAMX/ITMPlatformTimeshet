import { addDays, formatWeekRange } from "../timeFormat";
import { useI18n } from "../i18n";
import { Icon } from "./Icon";

interface Props {
  weekStart: Date;
  onChange: (weekStart: Date) => void;
}

export function WeekSelector({ weekStart, onChange }: Props) {
  const { t, locale } = useI18n();
  const weekEnd = addDays(weekStart, 6);
  return (
    <div className="week-selector">
      <button onClick={() => onChange(addDays(weekStart, -7))} aria-label={t("week.previous")}>
        <Icon name="chevron-left" size={14} />
      </button>
      <div className="week-label">{formatWeekRange(weekStart, weekEnd, locale)}</div>
      <button onClick={() => onChange(addDays(weekStart, 7))} aria-label={t("week.next")}>
        <Icon name="chevron-right" size={14} />
      </button>
      <button className="today-btn" onClick={() => onChange(new Date())}>
        {t("header.today")}
      </button>
    </div>
  );
}
