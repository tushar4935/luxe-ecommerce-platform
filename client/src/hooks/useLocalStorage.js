import { useState, useEffect, useCallback } from 'react';

/**
 * State synced to localStorage. Survives reloads and tabs (via the storage
 * event). Falls back gracefully when storage is unavailable.
 */
export function useLocalStorage(key, initialValue) {
  const read = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState(read);

  const setStored = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore quota / privacy errors */
        }
        return resolved;
      });
    },
    [key]
  );

  // Keep multiple tabs in sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key) setValue(read());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, read]);

  return [value, setStored];
}

export default useLocalStorage;
