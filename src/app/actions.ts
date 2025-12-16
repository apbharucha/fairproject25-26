
'use server';

import { z } from 'zod';
import { predictResistanceEmergence, PredictionInput, PredictionOutput } from '@/ai/flows/resistance-prediction-tool';
import { predictResistanceBayesian, PredictResistanceBayesianInput, PredictResistanceBayesianOutput } from '@/ai/flows/predict-resistance-bayesian';
import { addPrediction } from '@/firebase/firestore/mutations';

export type ResistancePredictionState = {
  result?: PredictionOutput;
  error?: string;
  input?: PredictionInput;
};

export type BayesianPredictionState = {
  result?: PredictResistanceBayesianOutput;
  error?: string;
  input?: PredictResistanceBayesianInput;
};

const resistancePredictionSchema = z.object({
  mutationPatterns: z.string().min(1, 'Mutation patterns are required.'),
  evolutionaryTrajectories: z.string().min(1, 'Evolutionary trajectories are required.'),
  existingKnowledge: z.string().optional(),
});

export async function resistancePredictionAction(prevState: ResistancePredictionState, formData: FormData): Promise<ResistancePredictionState> {
  const validatedFields = resistancePredictionSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const result = await predictResistanceEmergence(validatedFields.data);
    await addPrediction({
      type: 'evolutionary',
      input: validatedFields.data,
      output: result,
    });
    return { result, input: validatedFields.data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unknown error occurred.', input: validatedFields.data };
  }
}

const bayesianPredictionSchema = z.object({
  mecAMutations: z.string().min(1, 'mecA mutations are required.'),
  pbp2aMutations: z.string().min(1, 'PBP2a mutations are required.'),
  vancomycinResistanceProfile: z.string().optional(),
  ceftarolineResistanceProfile: z.string().optional(),
});


export async function bayesianPredictionAction(prevState: BayesianPredictionState, formData: FormData): Promise<BayesianPredictionState> {
  const validatedFields = bayesianPredictionSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors.map(e => e.message).join(', ') };
  }

  const input: PredictResistanceBayesianInput = {
    mecAMutations: validatedFields.data.mecAMutations.split(',').map(m => m.trim()).filter(Boolean),
    pbp2aMutations: validatedFields.data.pbp2aMutations.split(',').map(m => m.trim()).filter(Boolean),
    vancomycinResistanceProfile: validatedFields.data.vancomycinResistanceProfile,
    ceftarolineResistanceProfile: validatedFields.data.ceftarolineResistanceProfile,
  };

  try {
    const result = await predictResistanceBayesian(input);
    await addPrediction({
      type: 'bayesian',
      input: input,
      output: result,
    });
    return { result, input: input };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unknown error occurred.', input: input };
  }
}
