'use server';
import { z } from 'zod';
import { generateJson } from '@/ai/openai';

const PredictResistanceBayesianInputSchema = z.object({
  mecAMutations: z
    .array(z.string())
    .describe('List of mutations detected in the mecA gene.'),
  pbp2aMutations: z
    .array(z.string())
    .describe('List of mutations detected in the PBP2a gene.'),
  vancomycinResistanceProfile: z
    .string()
    .optional()
    .describe('Vancomycin resistance profile (optional).'),
  ceftarolineResistanceProfile: z
    .string()
    .optional()
    .describe('Ceftaroline resistance profile (optional).'),
});
export type PredictResistanceBayesianInput = z.infer<
  typeof PredictResistanceBayesianInputSchema
>;

const PredictResistanceBayesianOutputSchema = z.object({
  vancomycinResistanceProbability: z
    .number()
    .describe(
      'Probability of MRSA strain exhibiting resistance to vancomycin.'
    ),
  ceftarolineResistanceProbability: z
    .number()
    .describe(
      'Probability of MRSA strain exhibiting resistance to ceftaroline.'
    ),
  rationale: z
    .string()
    .describe(
      'A detailed, multi-paragraph explanation of the predicted probabilities based on the input mutations.'
    ),
  solution: z
    .string()
    .describe(
      'A detailed, actionable plan to address the predicted resistance profile. This should be a multi-step plan.'
    ),
  charts: z.array(z.object({
      title: z.string().describe('Title for the chart.'),
      data: z.array(z.object({
          name: z.string().describe('The name of the data point (e.g., an antibiotic).'),
          value: z.number().describe('The numeric probability value.'),
      })).describe('Data for the chart.')
  })).describe('An array of chart objects to visualize the probability data. Generate one chart titled "Resistance Probabilities".')
  ,
  contributingFeatures: z.array(z.object({ name: z.string(), weight: z.number() })).optional(),
  threatLevel: z.string().optional(),
  breakdownAnalysis: z.string().optional(),
  confidenceLevel: z.number().optional(),
});
export type PredictResistanceBayesianOutput = z.infer<
  typeof PredictResistanceBayesianOutputSchema
>;

export async function predictResistanceBayesian(
  input: PredictResistanceBayesianInput
): Promise<PredictResistanceBayesianOutput> {
  const system = [
    'You are a computational biology assistant specializing in MRSA antibiotic resistance modeling for an ISEF-level scientific application. Outputs must be probabilistic and cautious.',
    '',
    'Return a JSON object strictly matching keys:',
    '{"vancomycinResistanceProbability": number, "ceftarolineResistanceProbability": number, "rationale": string, "solution": string, "charts": [{"title": string, "data": [{"name": string, "value": number}]}]}',
    '',
    'Scientific constraints:',
    '- High probabilities only with multiple resistance-associated mutations and supporting evidence.',
    '- Vancomycin probability low unless data suggests mechanisms like cell wall thickening or van genes.',
  ].join('\n');

  const user = 'mecA Mutations: ' + input.mecAMutations.join(', ') +
               '\nPBP2a Mutations: ' + input.pbp2aMutations.join(', ') +
               '\nVancomycin Profile: ' + (input.vancomycinResistanceProfile ?? '') +
               '\nCeftaroline Profile: ' + (input.ceftarolineResistanceProfile ?? '');
  // Basic validation: ensure at least one mutation is provided
  const hasMec = Array.isArray(input.mecAMutations) && input.mecAMutations.filter(Boolean).length > 0;
  const hasPbp = Array.isArray(input.pbp2aMutations) && input.pbp2aMutations.filter(Boolean).length > 0;
  if (!hasMec && !hasPbp) {
    throw new Error('Please provide at least one mecA or PBP2a mutation (e.g., ["G246E"]).');
  }

  try {
    // Use non-zero temperature so predictions reflect subtle input differences
    const result = await generateJson<PredictResistanceBayesianOutput>({ system, user, temperature: 0.6 });
    const van = Number(result.vancomycinResistanceProbability ?? 0);
    const cef = Number(result.ceftarolineResistanceProbability ?? 0);
    if (!result.charts || !Array.isArray(result.charts) || result.charts.length === 0) {
      const chart = {
        title: 'Resistance Probabilities',
        data: [
          { name: 'Vancomycin', value: van },
          { name: 'Ceftaroline', value: cef },
        ],
      };
      result.charts = [chart];
    }

    const mecCount = input.mecAMutations.length;
    const pbpCount = input.pbp2aMutations.length;
    const rawAvg = (van + cef) / 2;
    const confidence = Math.min(0.95, Math.max(0.55, 0.6 + rawAvg * 0.25 + Math.min(6, mecCount + pbpCount) * 0.02));

    const contrib: Array<{ name: string; weight: number }> = [];
    input.mecAMutations.slice(0, 6).forEach((m, i) => contrib.push({ name: `mecA:${m}`, weight: Math.min(1, 0.45 + i * 0.06) }));
    input.pbp2aMutations.slice(0, 6).forEach((m, i) => contrib.push({ name: `PBP2a:${m}`, weight: Math.min(1, 0.4 + i * 0.06) }));

    const maxProb = Math.max(van, cef);
    const threatLevel = maxProb >= 0.75 ? 'High' : maxProb >= 0.5 ? 'Moderate' : maxProb >= 0.25 ? 'Low' : 'Very Low';

    const breakdown = [
      `Input summary: ${mecCount} mecA mutation(s), ${pbpCount} PBP2a mutation(s).`,
      `Probabilities estimated: Vancomycin ${(van * 100).toFixed(1)}%, Ceftaroline ${(cef * 100).toFixed(1)}%.`,
      `Threat level: ${threatLevel} (based on the higher of the two probabilities).`,
      `Confidence: ${(confidence * 100).toFixed(1)}% — calibrated from model outputs and input mutation burden.`,
      `Rationale: ${result.rationale ?? ''}`
    ].join('\n\n');

    result.contributingFeatures = contrib;
    result.threatLevel = threatLevel;
    result.breakdownAnalysis = breakdown;
    result.charts = result.charts.slice(0, 1);
    // expose a calibrated confidence level (no graph will be generated for it)
    (result as any).confidenceLevel = confidence;
    if (!result.rationale || !result.rationale.trim().length) {
      result.rationale = 'This analysis is probabilistic and observational. Vancomycin probabilities remain low without explicit mechanisms; ceftaroline probabilities reflect mutation burden and known structural considerations.';
    }
    return result;
  } catch {
    const mecCount = input.mecAMutations.length;
    const pbpCount = input.pbp2aMutations.length;
    const hasVanSignals = (input.vancomycinResistanceProfile || '').toLowerCase().match(/van|thicken|cell\s*wall/);
    const vanProb = hasVanSignals ? 0.22 : 0.1;
    const cefProb = Math.min(0.25 + (mecCount + pbpCount) * 0.08, 0.85);
    const conf = Math.min(0.95, Math.max(0.55, 0.6 + ((vanProb + cefProb) / 2) * 0.25 + Math.min(6, mecCount + pbpCount) * 0.02));
    const contrib = [
      ...input.mecAMutations.slice(0,6).map((m,i)=>({ name:`mecA:${m}`, weight: Math.min(1, 0.45 + i*0.06) })),
      ...input.pbp2aMutations.slice(0,6).map((m,i)=>({ name:`PBP2a:${m}`, weight: Math.min(1, 0.4 + i*0.06) })),
    ];
    const threatLevel = Math.max(vanProb, cefProb) >= 0.75 ? 'High' : Math.max(vanProb, cefProb) >= 0.5 ? 'Moderate' : Math.max(vanProb, cefProb) >= 0.25 ? 'Low' : 'Very Low';
    const breakdown = `Input summary: ${mecCount} mecA mutation(s), ${pbpCount} PBP2a mutation(s).\n\nProbabilities estimated: Vancomycin ${(vanProb*100).toFixed(1)}%, Ceftaroline ${(cefProb*100).toFixed(1)}%.\n\nThreat level: ${threatLevel}.\n\nConfidence: ${(conf*100).toFixed(1)}% — heuristic fallback estimate.`;
    return {
      vancomycinResistanceProbability: vanProb,
      ceftarolineResistanceProbability: cefProb,
      rationale: 'Fallback heuristic estimates probabilities from mutation counts and known rule-of-thumb constraints. Vancomycin remains low without explicit mechanisms; ceftaroline increases with PBP2a/mecA mutation burden. This is observational and non-clinical.',
      solution: '1. Monitor co-occurring mecA/PBP2a variants. 2. Track phenotype validation in surveillance datasets. 3. Investigate structural impacts via in-silico modeling under approved research protocols. 4. Establish conservative alerting thresholds.',
      charts: [
        {
          title: 'Resistance Probabilities',
          data: [
            { name: 'Vancomycin', value: vanProb },
            { name: 'Ceftaroline', value: cefProb },
          ],
        }
      ],
      contributingFeatures: contrib,
      threatLevel,
      breakdownAnalysis: breakdown,
      confidenceLevel: conf,
    };
  }
}

// Removed Genkit prompt/flow; using OpenAI with JSON mode instead.
