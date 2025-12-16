import OpenAI from 'openai';
import { OpenRouter } from '@openrouter/sdk';

const rawKey = (process.env.OPENAI_API_KEY || '').trim();
if (!rawKey) {
  throw new Error('OPENAI_API_KEY is not set. Add it to your environment.');
}

const isOpenRouter = rawKey.startsWith('sk-or-');

const siteUrl = (process.env.OPENROUTER_SITE_URL || '').trim();
const siteTitle = (process.env.OPENROUTER_SITE_TITLE || '').trim();

const openaiClient = new OpenAI({ apiKey: rawKey });
const openRouterClient = new OpenRouter({ apiKey: rawKey });

function defaultModel() {
  return isOpenRouter ? 'openai/gpt-4o' : 'gpt-4o-mini';
}

export async function generateJson<T>(args: {
  model?: string;
  system: string;
  user: string;
}): Promise<T> {
  const model = args.model ?? defaultModel();

  if (isOpenRouter) {
    const completion = await openRouterClient.chat.send(
      {
        model,
        messages: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.user },
        ],
        stream: false,
      },
      {
        headers: {
          ...(siteUrl ? { 'HTTP-Referer': siteUrl } : {}),
          ...(siteTitle ? { 'X-Title': siteTitle } : {}),
        },
      }
    );
    const content = completion.choices?.[0]?.message?.content || '{}';
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(text) as T;
  } else {
    const completion = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    const content = completion.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(content) as T;
  }
}
