export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listPredictions } from '@/db/sqlite';

export async function GET() {
  try {
    const predictions = listPredictions(10);
    return NextResponse.json({ predictions });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load predictions' }, { status: 500 });
  }
}

