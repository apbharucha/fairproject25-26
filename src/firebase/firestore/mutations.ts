import { addPredictionToSqlite } from '@/db/sqlite';

export async function addPrediction(predictionData: any) {
	try {
		addPredictionToSqlite(predictionData);
	} catch (e: any) {
		throw new Error('Could not save prediction to the database.');
	}
}
