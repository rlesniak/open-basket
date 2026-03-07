import { generateText } from 'ai';
import { openrouter, OPENROUTER_MODELS } from './openrouter';
import { z } from 'zod';

const CATEGORIES = ['Owoce', 'Warzywa', 'Nabiał', 'Mięso', 'Pieczywo', 'Napoje', 'Chemia', 'Słodycze', 'Inne'] as const;

const ParseResultSchema = z.object({
  name: z.string(),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  note: z.string().nullable(),
  category: z.enum(CATEGORIES),
  store: z.string().nullable(), // NEW: extracted store name/keyword
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

export async function parseProductInput(input: string): Promise<ParseResult> {
  const systemPrompt = `Jesteś asystentem do parsowania produktów spożywczych.

Przekształć tekst na JSON z polami:
- name: nazwa produktu
- qty: ilość (liczba całkowita lub null)
- unit: jednostka miary (szt, kg, g, l, ml, opak) lub null
- note: dodatkowe informacje lub null
- category: jedna z kategorii: ${CATEGORIES.join(',')}
- store: nazwa sklepu jeśli wymieniona (np. "z DELI", "z Lidla"), inaczej null

Rozpoznawaj słowa kluczowe sklepów:
- "z DELI", "z deli" → store: "deli"
- "z Lidla", "z Lidl" → store: "lidl"
- "z Biedronki" → store: "biedronka"
- "z piekarni" → store: "piekarnia"

Przykłady:
"mleko 10 sztuk, 3.2%" → {"name": "mleko", "qty": 10, "unit": "szt", "note": "3.2%", "category": "Nabiał", "store": null}
"kawa z DELI" → {"name": "kawa", "qty": null, "unit": null, "note": null, "category": "Napoje", "store": "deli"}
"chleb z piekarni" → {"name": "chleb", "qty": null, "unit": null, "note": null, "category": "Pieczywo", "store": "piekarnia"}

Zwróć TYLKO obiekt JSON.`;

  const { text } = await generateText({
    model: openrouter(OPENROUTER_MODELS.GPT4O_MINI),
    system: systemPrompt,
    prompt: `Input: "${input}"\nOutput:`,
    maxOutputTokens: 150,
    temperature: 0.1,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return ParseResultSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse AI response:', error, 'Response:', text);
    return {
      name: input,
      qty: null,
      unit: null,
      note: null,
      category: 'Inne' as any,
      store: null,
    };
  }
}

// Match parsed store keyword against available stores
export async function matchStoreFromKeywords(
  parsedStore: string | null,
  availableStores: Array<{ id: string; name: string; keywords: string | null }>
): Promise<string | null> {
  if (!parsedStore) return null;

  const normalizedInput = parsedStore.toLowerCase().trim();

  for (const store of availableStores) {
    if (store.keywords) {
      const keywords = store.keywords.toLowerCase().split(',').map(k => k.trim());
      if (keywords.some(kw => normalizedInput.includes(kw))) {
        return store.id;
      }
    }
    // Also check store name
    if (normalizedInput.includes(store.name.toLowerCase())) {
      return store.id;
    }
  }

  return null;
}
