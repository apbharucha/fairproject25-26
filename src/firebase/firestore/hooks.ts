// No-op Firestore hooks for local development.
export function useDoc<T>(_ref: any) {
	return { data: undefined as T | undefined, loading: false, error: null };
}

export function useCollection<T>(_q: any) {
	return { data: [] as T[], loading: false, error: null };
}
