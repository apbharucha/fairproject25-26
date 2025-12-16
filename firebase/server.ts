
// Firebase Admin disabled for local/offline development.
// The original project used the Firebase Admin SDK to persist data to Firestore.
// For the local, Firebase-free edition we keep a minimal stub so imports succeed.
export function initializeFirebaseAdmin(): null {
  // If you later want to enable Firebase Admin locally, replace this stub with
  // the original initialization using `firebase-admin` and provide credentials.
  // For now, return null to indicate admin SDK is not initialized.
  // This avoids requiring `firebase-admin` in the dependency tree.
  // eslint-disable-next-line no-console
  console.warn('Firebase Admin SDK initialization skipped (local Firebase disabled).');
  return null;
}
