export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { resistancePredictionAction, bayesianPredictionAction } from '@/app/actions';

export async function GET() {
  try {
    // Build FormData for resistance prediction
    const fd1 = new FormData();
    fd1.set('mutationPatterns', 'mecA(G246E), PBP2a(V311A)');
    fd1.set('evolutionaryTrajectories', 'mecA -> PBP2a');

    const res1 = await resistancePredictionAction({}, fd1 as any);

    // Build FormData for bayesian prediction
    const fd2 = new FormData();
    fd2.set('mecAMutations', 'G246E');
    fd2.set('pbp2aMutations', 'V311A');

    const res2 = await bayesianPredictionAction({}, fd2 as any);

    return NextResponse.json({ resistance: res1, bayesian: res2 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error in test-actions route:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
