import { addDays, toIsoDate, todayStr, weekdayShort } from "../timeFormat";
import { useI18n } from "../i18n";

interface Props {
  weekStart: Date;
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DaySelector({ weekStart, selectedDate, onSelect }: Props) {
  const { locale } = useI18n();
  const today = todayStr();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="day-selector">
      {days.map((day) => {
        const iso = toIsoDate(day);
        const isSelected = iso === selectedDate;
        const isToday = iso === today;
        return (
          <button
            key={iso}
            className={`day-chip ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
            onClick={() => onSelect(iso)}
          >
            <span className="day-chip-weekday">{weekdayShort(day, locale)}</span>
            <span className="day-chip-num">{day.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
