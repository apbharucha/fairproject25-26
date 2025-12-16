
'use client';

import { useMemo, type DependencyList } from 'react';

// A custom hook to memoize Firebase queries and references.
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
