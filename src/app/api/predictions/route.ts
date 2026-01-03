export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamically import DB helpers to avoid import-time native module issues
    const mod = await import('@/db/sqlite');
    const { listPredictions } = mod;
    const predictions = listPredictions(10);
    return NextResponse.json({ predictions });
  } catch (e) {
    // Log the error so devs can inspect server logs (visible in terminal)
    // and return a 500 JSON response to the client.
    // eslint-disable-next-line no-console
    console.error('Error in /api/predictions GET:', e);
    return NextResponse.json({ error: 'Failed to load predictions' }, { status: 500 });
  }
}

