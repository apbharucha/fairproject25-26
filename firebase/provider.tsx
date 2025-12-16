
'use client';
import React, { createContext, useContext } from 'react';

// Minimal no-op Firebase provider and hooks.
// This keeps the same API surface as before but does not require the Firebase SDK.

type MinimalFirebase = {
  app: null;
  auth: null;
  firestore: null;
};

const FirebaseContext = createContext<MinimalFirebase | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const value: MinimalFirebase = { app: null, auth: null, firestore: null };
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export const useFirebase = (): MinimalFirebase => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
