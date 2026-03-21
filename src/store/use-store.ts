'use client';

import { useState, useEffect } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * Hydration-safe wrapper for Zustand persisted stores.
 * Returns undefined during SSR/initial render, then the real store value after mount.
 * This prevents hydration mismatches when localStorage data differs from initial state.
 */
export function useHydrated<T, U>(
  useStore: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => U
): U | undefined {
  const storeValue = useStore(selector);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? storeValue : undefined;
}
