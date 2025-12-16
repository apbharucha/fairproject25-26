'use client';

import { useState } from 'react';

// No-op Firestore hooks for local development.
// These preserve the API surface but do not require the Firebase SDK.

export function useDoc<T>(_ref: any) {
  const [data] = useState<T | undefined>(undefined);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);
  return { data, loading, error };
}

export function useCollection<T>(_q: any) {
  const [data] = useState<T[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);
  return { data, loading, error };
}
