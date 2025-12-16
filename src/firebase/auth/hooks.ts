// No-op user hook for local development (keeps API stable).
export function useUser() {
	return { user: null, loading: false, error: null };
}
