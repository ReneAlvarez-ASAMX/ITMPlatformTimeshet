// Tipos compartidos entre el proceso principal (main), el preload y el renderer.
// Los tipos de payloads de la API de ITM Platform respetan el PascalCase original
// devuelto por el servidor para evitar errores de mapeo.

export interface Credentials {
  company: string;
  apiKey: string;
}

export interface Session {
  token: string;
  userId: string;
}

export interface LoginResponse {
  Token: string;
  UserID: string;
  Result: string;
  ResultStatus: string;
}

export interface WorkingHoursDay {
  Date: string;
  WorkingHoursDay: string;
  NonWorkingDay: boolean;
}

export interface TimeEntry {
  Date: string;
  EditingAllowed: boolean;
  TimeEntryAllowed: boolean;
  EstimatedHours: string;
  ReportedHours: string;
  UserComments: string | null;
  Approval: unknown;
}

export interface WorkItem {
  Type: string;
  WorkItemNo: string;
  Completed: boolean;
  WorkItemId: number;
  Name: string;
  IsManager: boolean;
  ProgressReportAllowed: boolean;
  CommentsAllowed: boolean;
  PreviousHoursAccum: string;
  TimeEntries: TimeEntry[];
}

export interface TimeReportGroup {
  Type: string;
  EntityNo: string;
  Completed: boolean;
  EntityId: number;
  Name: string;
  IsManager: boolean;
  OrderOnList: number;
  WorkItems: WorkItem[];
}

export interface TimesheetResponse {
  Timeframe: { PeriodStart: string; PeriodEnd: string };
  User: {
    UserId: number;
    PersonnelNumber: string;
    DisplayName: string;
    UserPicture32x32: string;
  };
  WorkingHours: WorkingHoursDay[];
  TimeReports: TimeReportGroup[];
}

export interface TimeReportSubmitEntry {
  EntityId: number;
  WorkItemId: number;
  Date: string;
  ReportedHours: string;
  UserComment?: string;
  BillingCategoryId?: number;
  NonBillableMins?: string;
}

export interface SubmitTimeEntriesRequest {
  UserId?: number;
  TimeReports: TimeReportSubmitEntry[];
}

export interface SubmitTimeEntriesError {
  EntityId: number;
  WorkItemId: number;
  Message: string;
}

export interface SubmitTimeEntriesResponse {
  StatusMessage: string;
  StatusCode: number;
  Errors?: SubmitTimeEntriesError[];
}

export interface ItmApiError {
  message: string;
  status?: number;
}

// --- Estado local persistido (cronómetros y tiempo pendiente de sincronizar) ---

export interface TimerRecord {
  workItemId: number;
  entityId: number;
  taskName: string;
  projectName: string;
  date: string; // YYYY-MM-DD al que se imputa el tiempo acumulado
  startedAt: number | null; // epoch ms; null si está pausado/detenido
  accumulatedSeconds: number; // segundos no sincronizados aún con ITM Platform
  running: boolean;
  comment: string; // nota local que se envía como UserComment al sincronizar
}

export interface AppState {
  timers: Record<string, TimerRecord>; // key: workItemId
  favorites: Record<string, boolean>; // key: workItemId; true = marcada como Destacada
}

export const emptyAppState = (): AppState => ({ timers: {}, favorites: {} });

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
}

export const defaultReminderSettings = (): ReminderSettings => ({
  enabled: true,
  intervalMinutes: 5,
});
