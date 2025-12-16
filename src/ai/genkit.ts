let __server_only = false;
try {
  // Dynamically require to avoid failing in non-Next Node environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('server-only');
  __server_only = true;
} catch {}
import {genkit} from 'genkit';

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
let plugins: any[] = [];
let model: string | undefined = undefined;

if (nodeMajor < 25) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { googleAI } = require('@genkit-ai/google-genai');
    plugins = [googleAI()];
    model = 'googleai/gemini-2.5-flash';
  } catch {}
}

export const ai = genkit({
  plugins,
  model,
});
