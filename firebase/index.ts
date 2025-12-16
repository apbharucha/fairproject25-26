
// Lightweight, Firebase-free adapter.
// The project previously used Firebase but currently persists predictions via `@/db/sqlite`.
// Keep a minimal index so imports to `@/firebase/*` do not require the Firebase SDK.

export function initializeFirebase() {
  // Return a minimal object to satisfy any accidental runtime usage.
  return { app: null, auth: null, firestore: null };
}

export { addPrediction } from './firestore/mutations';

// Re-export no-op provider/hook implementations from provider.tsx to avoid breaking imports.
export { FirebaseProvider, useAuth, useFirebase, useFirebaseApp, useFirestore } from './provider';
