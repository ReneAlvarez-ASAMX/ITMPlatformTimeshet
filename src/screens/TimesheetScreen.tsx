import { useCallback, useEffect, useMemo, useState } from "react";
import { WeekSelector } from "../components/WeekSelector";
import { DaySelector } from "../components/DaySelector";
import { TaskList } from "../components/TaskList";
import { SyncBar } from "../components/SyncBar";
import { MiniView } from "../components/MiniView";
import { ReminderSettingsControl } from "../components/ReminderSettingsControl";
import { AutoLaunchControl } from "../components/AutoLaunchControl";
import { DailyFavoritesPrompt } from "../components/DailyFavoritesPrompt";
import { UpdateControl } from "../components/UpdateControl";
import { SyncReviewPanel } from "../components/SyncReviewPanel";
import { useTimesheet } from "../hooks/useTimesheet";
import { useTimers } from "../hooks/useTimers";
import { collectPending, useSync } from "../hooks/useSync";
import { startOfWeek, toIsoDate, addDays, formatDayLabel, todayStr } from "../timeFormat";

interface Props {
  account: { company: string; userId: string };
  onLogout: () => void;
}

type FilterMode = "all" | "active" | "favorites";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// La pregunta diaria de tareas destacadas solo se hace al iniciar la aplicación: esta marca vive
// mientras el proceso del renderer siga abierto, así que "Cambiar cuenta" o cerrar a la bandeja no la repiten.
let dailyFavoritesPromptHandled = false;

export function TimesheetScreen({ account, onLogout }: Props) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [defaultFilterApplied, setDefaultFilterApplied] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [miniMode, setMiniModeState] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dailyFavoritesOpen, setDailyFavoritesOpen] = useState(false);
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(addDays(weekStart, 6));
  const isToday = selectedDate === todayStr();

  const { data, loading, error, refetch } = useTimesheet(startIso, endIso);
  const timers = useTimers();
  const { syncing, lastError, itemErrors, submit } = useSync();

  function handleWeekChange(rawDate: Date) {
    const newStart = startOfWeek(rawDate);
    setWeekStart(newStart);
    const newStartIso = toIsoDate(newStart);
    const newEndIso = toIsoDate(addDays(newStart, 6));
    const today = todayStr();
    setSelectedDate(today >= newStartIso && today <= newEndIso ? today : newStartIso);
  }

  const searchFiltered = useMemo(() => {
    if (!data) return [];
    const term = normalize(search.trim());
    if (!term) return data.TimeReports;
    return data.TimeReports
      .map((project) => {
        const projectMatches = normalize(project.Name).includes(term);
        const workItems = projectMatches
          ? project.WorkItems
          : project.WorkItems.filter((wi) => normalize(wi.Name).includes(term));
        return { ...project, WorkItems: workItems };
      })
      .filter((project) => project.WorkItems.length > 0);
  }, [data, search]);

  // Vista predeterminada: si el usuario ya tiene tareas destacadas la primera vez
  // que carga el estado local, se abre directamente en la vista "Destacadas".
  useEffect(() => {
    if (defaultFilterApplied || !timers.loaded) return;
    const hasFavorites = Object.keys(timers.favorites).length > 0;
    setFilterMode(hasFavorites ? "favorites" : "all");
    setDefaultFilterApplied(true);
  }, [defaultFilterApplied, timers.loaded, timers.favorites]);

  // Pregunta diaria: una sola vez por arranque, cuando ya hay tareas y estado local cargados.
  useEffect(() => {
    if (dailyFavoritesPromptHandled || !timers.loaded || !data) return;
    if (data.TimeReports.every((project) => project.WorkItems.length === 0)) return;
    dailyFavoritesPromptHandled = true;
    setDailyFavoritesOpen(true);
  }, [timers.loaded, data]);

  function handleDailyFavoritesSave(workItemIds: number[]) {
    timers.replaceFavorites(workItemIds);
    setFilterMode(workItemIds.length > 0 ? "favorites" : "all");
    setDailyFavoritesOpen(false);
  }

  const visibleProjects = useMemo(() => {
    if (filterMode === "active") {
      return searchFiltered
        .map((project) => ({
          ...project,
          WorkItems: project.WorkItems.filter((wi) => timers.timers[String(wi.WorkItemId)]?.running),
        }))
        .filter((project) => project.WorkItems.length > 0);
    }
    if (filterMode === "favorites") {
      return searchFiltered
        .map((project) => ({
          ...project,
          WorkItems: project.WorkItems.filter((wi) => timers.isFavorite(wi.WorkItemId)),
        }))
        .filter((project) => project.WorkItems.length > 0);
    }
    return searchFiltered;
  }, [searchFiltered, filterMode, timers.timers, timers.isFavorite]);

  const toggleProject = useCallback((entityId: number) => {
    setCollapsed((prev) => ({ ...prev, [entityId]: !prev[entityId] }));
  }, []);

  const expandAll = useCallback(() => setCollapsed({}), []);

  const collapseAll = useCallback(() => {
    const next: Record<number, boolean> = {};
    for (const project of visibleProjects) next[project.EntityId] = true;
    setCollapsed(next);
  }, [visibleProjects]);

  const pending = useMemo(
    () => collectPending(timers.timers, timers.getElapsedSeconds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timers.timers]
  );

  async function handleConfirmSync() {
    const result = await submit(pending, (ids) => timers.markSynced(ids));
    if (result.successCount > 0) refetch();
    if (result.successCount > 0 && result.failureCount === 0) setReviewOpen(false);
  }

  async function handleLogout() {
    await window.itm.logout();
    onLogout();
  }

  function setMini(enabled: boolean) {
    setMiniModeState(enabled);
    window.itm.setMiniMode(enabled);
  }

  if (miniMode) {
    return <MiniView timers={timers} onExit={() => setMini(false)} />;
  }

  return (
    <div className="timesheet-screen">
      <header className="app-header">
        <div>
          <h1>ITM Platform Timesheet</h1>
          <span className="account-label">{account.company}</span>
        </div>
        <div className="header-actions">
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarea o proyecto…"
          />
          <ReminderSettingsControl />
          <AutoLaunchControl />
          <UpdateControl />
          <button className="btn-link" onClick={() => setMini(true)}>
            Modo mini
          </button>
          <button className="btn-link" onClick={handleLogout}>
            Cambiar cuenta
          </button>
        </div>
      </header>

      <div className="day-bar">
        <WeekSelector weekStart={weekStart} onChange={handleWeekChange} />
        <DaySelector weekStart={weekStart} selectedDate={selectedDate} onSelect={setSelectedDate} />
        <div className="day-heading">
          {capitalize(formatDayLabel(selectedDate))}
          {isToday && <span className="today-badge">Hoy</span>}
        </div>
        <button className="btn-refresh" onClick={() => refetch()} disabled={loading}>
          <span className={`refresh-icon ${loading ? "spinning" : ""}`}>↻</span>
          {loading ? "Actualizando…" : "Actualizar tareas"}
        </button>
      </div>

      <main className="app-main">
        {loading && <div className="loading-state">Cargando tareas…</div>}
        {error && (
          <div className="error-box">
            {error}
            <button onClick={() => refetch()}>Reintentar</button>
          </div>
        )}
        {!loading && !error && data && (
          <>
            <div className="list-toolbar">
              <div className="list-toolbar-group">
                <button className="btn-link" onClick={expandAll}>
                  Expandir todo
                </button>
                <button className="btn-link" onClick={collapseAll}>
                  Colapsar todo
                </button>
              </div>
              <div className="filter-toggle">
                <button
                  className={filterMode === "all" ? "active" : ""}
                  onClick={() => setFilterMode("all")}
                >
                  Todas las tareas
                </button>
                <button
                  className={filterMode === "favorites" ? "active" : ""}
                  onClick={() => setFilterMode("favorites")}
                >
                  Destacadas
                </button>
                <button
                  className={filterMode === "active" ? "active" : ""}
                  onClick={() => setFilterMode("active")}
                >
                  Con temporizador activo
                </button>
              </div>
            </div>
            <TaskList
              projects={visibleProjects}
              timers={timers}
              forceExpanded={search.trim().length > 0}
              collapsed={collapsed}
              onToggleProject={toggleProject}
              selectedDate={selectedDate}
              isToday={isToday}
            />
          </>
        )}
      </main>

      <SyncBar
        pending={pending}
        syncing={syncing}
        lastError={lastError}
        itemErrors={itemErrors}
        onReview={() => setReviewOpen(true)}
      />

      {dailyFavoritesOpen && data && (
        <DailyFavoritesPrompt
          projects={data.TimeReports.filter((project) => project.WorkItems.length > 0)}
          favoriteCount={Object.keys(timers.favorites).length}
          onSave={handleDailyFavoritesSave}
          onClose={() => setDailyFavoritesOpen(false)}
        />
      )}

      {reviewOpen && (
        <SyncReviewPanel
          pending={pending}
          timers={timers}
          syncing={syncing}
          lastError={lastError}
          itemErrors={itemErrors}
          onConfirm={handleConfirmSync}
          onCancel={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}
