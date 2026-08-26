import { useCallback, useEffect, useState } from "react";
import type { TimesheetResponse } from "../../electron/types";

export function useTimesheet(startDate: string, endDate: string) {
  const [data, setData] = useState<TimesheetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.itm.getTimesheet(startDate, endDate);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo cargar el timesheet.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
