// Minimal firebase compatibility layer implemented in-source.
export function initializeFirebase() {
	return { app: null, auth: null, firestore: null };
}

export { FirebaseProvider, useAuth, useFirebase, useFirebaseApp, useFirestore } from './provider';

export { addPrediction } from './firestore/mutations';
