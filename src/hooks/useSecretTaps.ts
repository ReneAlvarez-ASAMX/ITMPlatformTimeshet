import { useCallback, useRef } from "react";

/**
 * Devuelve un manejador de clic que dispara `onTrigger` tras `taps` clics seguidos
 * dentro de `windowMs`. Sirve para activar funciones ocultas sin ningún control visible.
 */
export function useSecretTaps(onTrigger: () => void, taps = 7, windowMs = 3000) {
  const times = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    times.current = [...times.current.filter((t) => now - t < windowMs), now];
    if (times.current.length >= taps) {
      times.current = [];
      onTrigger();
    }
  }, [onTrigger, taps, windowMs]);
}
