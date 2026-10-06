import { useCallback, useEffect, useRef, useState } from "react";
import type { TimesheetResponse } from "../../electron/types";
import { useI18n } from "../i18n";

export function useTimesheet(startDate: string, endDate: string) {
  const [data, setData] = useState<TimesheetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Se guarda en una referencia para que cambiar de idioma no vuelva a pedir el timesheet.
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.itm.getTimesheet(startDate, endDate);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? tRef.current("list.loadError"));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
