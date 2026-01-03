export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!idNum || Number.isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid graph id' }, { status: 400 });
  }
  try {
    const mod = await import('@/db/sqlite');
    const { getGraphById } = mod;
    const graph = getGraphById(idNum);
    if (!graph) {
      return NextResponse.json({ error: 'Graph not found' }, { status: 404 });
    }
    return NextResponse.json({ graph });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error in /api/graphs/${id} GET:`, e);
    return NextResponse.json({ error: 'Failed to load graph' }, { status: 500 });
  }
}
