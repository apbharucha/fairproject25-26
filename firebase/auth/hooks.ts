'use client';

import { useState } from 'react';

// No-op user hook to avoid requiring the Firebase SDK in local development.
// Returns a stable shape the app expects: `user`, `loading`, `error`.
export function useUser() {
  const [user] = useState(null);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);
  return { user, loading, error };
}
