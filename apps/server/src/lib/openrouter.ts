import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': 'https://listonic.app',
    'X-Title': 'Listonic Shopping App',
  },
});

export const OPENROUTER_MODELS = {
  GPT4O_MINI: 'openai/gpt-4o-mini',
  GEMINI_3_1_FLASH: 'google/gemini-3.1-flash-lite-preview'
} as const;
