import { addDays } from "../timeFormat";
import { Icon } from "./Icon";

interface Props {
  weekStart: Date;
  onChange: (weekStart: Date) => void;
}

const formatter = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" });

export function WeekSelector({ weekStart, onChange }: Props) {
  const weekEnd = addDays(weekStart, 6);
  return (
    <div className="week-selector">
      <button onClick={() => onChange(addDays(weekStart, -7))} aria-label="Semana anterior">
        <Icon name="chevron-left" size={14} />
      </button>
      <div className="week-label">
        {formatter.format(weekStart)} – {formatter.format(weekEnd)}
      </div>
      <button onClick={() => onChange(addDays(weekStart, 7))} aria-label="Semana siguiente">
        <Icon name="chevron-right" size={14} />
      </button>
      <button className="today-btn" onClick={() => onChange(new Date())}>
        Hoy
      </button>
    </div>
  );
}
