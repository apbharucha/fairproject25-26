export async function addPrediction(predictionData: any) {
	try {
		// Dynamically import the SQLite helper to avoid importing native modules
		// at module-evaluation time (which can crash server actions in some
		// environments). This mirrors lazy-loading used in API routes.
		const mod = await import('@/db/sqlite');
		const { addPredictionToSqlite } = mod;
		addPredictionToSqlite(predictionData);
	} catch (e: any) {
		// eslint-disable-next-line no-console
		console.error('Failed to save prediction:', e);
		throw new Error('Could not save prediction to the database.');
	}
}
