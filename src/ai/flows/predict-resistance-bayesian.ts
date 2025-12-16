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
  try {
    const result = await generateJson<PredictResistanceBayesianOutput>({ system, user });
    const conf = Math.max(0, Math.min(1, ((result.vancomycinResistanceProbability ?? 0) + (result.ceftarolineResistanceProbability ?? 0)) / 2));
    if (!result.charts || !Array.isArray(result.charts) || result.charts.length === 0) {
      const chart = {
        title: 'Resistance Probabilities',
        data: [
          { name: 'Vancomycin', value: result.vancomycinResistanceProbability ?? 0 },
          { name: 'Ceftaroline', value: result.ceftarolineResistanceProbability ?? 0 },
        ],
      };
      result.charts = [chart];
    }
    // Ensure a confidence visualization exists
    result.charts.push({ title: 'Model Confidence', data: [{ name: 'Confidence', value: conf }] });
    if (!result.rationale || result.rationale.trim().length === 0) {
      result.rationale = 'This analysis is probabilistic and observational. Vancomycin probabilities remain low without explicit mechanisms; ceftaroline probabilities reflect mutation burden and known structural considerations.';
    }
    return result;
  } catch {
    const mecCount = input.mecAMutations.length;
    const pbpCount = input.pbp2aMutations.length;
    const hasVanSignals = (input.vancomycinResistanceProfile || '').toLowerCase().match(/van|thicken|cell\s*wall/);
    const vanProb = hasVanSignals ? 0.22 : 0.1;
    const cefProb = Math.min(0.25 + (mecCount + pbpCount) * 0.08, 0.85);
    const conf = Math.max(0, Math.min(1, (vanProb + cefProb) / 2));
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
        },
        { title: 'Model Confidence', data: [{ name: 'Confidence', value: conf }] },
      ],
    };
  }
}

// Removed Genkit prompt/flow; using OpenAI with JSON mode instead.
