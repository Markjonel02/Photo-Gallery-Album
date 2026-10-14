import { useEffect, useState } from 'react';
import { APP_LIMITS } from '@/config/env';

/** Returns `value` only after it has stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number = APP_LIMITS.searchDebounceMs): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
