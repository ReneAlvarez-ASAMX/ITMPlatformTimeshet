import { useState } from "react";
import type { TimeReportGroup } from "../../electron/types";
import { Icon } from "./Icon";

interface Props {
  projects: TimeReportGroup[];
  favoriteCount: number;
  onSave: (workItemIds: number[]) => void;
  onClose: () => void;
}

/**
 * Se muestra una vez al iniciar la app: pregunta si se quiere reestablecer la lista de tareas
 * destacadas (la prioridad cambia cada día) y, si es así, deja elegir de nuevo desde cero.
 */
export function DailyFavoritesPrompt({ projects, favoriteCount, onSave, onClose }: Props) {
  const [step, setStep] = useState<"ask" | "pick">("ask");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(workItemId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(workItemId)) next.delete(workItemId);
      else next.add(workItemId);
      return next;
    });
  }

  if (step === "ask") {
    return (
      <div className="review-backdrop">
        <div className="review-panel daily-favorites-ask">
          <div className="review-header">
            <h2>Tareas destacadas de hoy</h2>
          </div>
          <div className="daily-favorites-body">
            <p>
              ¿Quieres reestablecer tu lista de tareas destacadas? La prioridad puede ser distinta
              cada día.
            </p>
            <p className="hint">
              {favoriteCount === 0
                ? "Ahora mismo no tienes ninguna tarea destacada."
                : `Ahora mismo tienes ${favoriteCount} ${favoriteCount === 1 ? "tarea destacada" : "tareas destacadas"}.`}
            </p>
          </div>
          <div className="review-actions">
            <button className="btn-link" onClick={onClose}>
              No, mantener la lista
            </button>
            <button className="btn-sync" onClick={() => setStep("pick")}>
              Sí, reestablecer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-backdrop">
      <div className="review-panel">
        <div className="review-header">
          <h2>Marca tus tareas destacadas de hoy</h2>
        </div>
        <div className="review-list">
          {projects.map((project) => (
            <div key={project.EntityId} className="daily-favorites-project">
              <div className="daily-favorites-project-name">{project.Name}</div>
              {project.WorkItems.map((wi) => {
                const active = selected.has(wi.WorkItemId);
                return (
                  <div key={wi.WorkItemId} className="daily-favorites-task">
                    <button
                      className={`btn-favorite ${active ? "active" : ""}`}
                      onClick={() => toggle(wi.WorkItemId)}
                      title={active ? "Quitar de destacadas" : "Marcar como destacada"}
                      aria-pressed={active}
                    >
                      <Icon name="star" size={16} filled={active} />
                    </button>
                    <span>{wi.Name}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="review-actions">
          <button className="btn-link" onClick={onClose}>
            Cancelar (mantener la lista anterior)
          </button>
          <button className="btn-sync" onClick={() => onSave([...selected])}>
            Guardar destacadas ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
