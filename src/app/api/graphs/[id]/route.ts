export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getGraphById } from '@/db/sqlite';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!idNum || Number.isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid graph id' }, { status: 400 });
  }
  try {
    const graph = getGraphById(idNum);
    if (!graph) {
      return NextResponse.json({ error: 'Graph not found' }, { status: 404 });
    }
    return NextResponse.json({ graph });
  } catch {
    return NextResponse.json({ error: 'Failed to load graph' }, { status: 500 });
  }
}
