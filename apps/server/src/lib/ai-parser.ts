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
  storeId: z.string().nullable(), // ID of matched store
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

export type StoreInfo = {
  id: string;
  name: string;
  keywords: string | null;
};

function buildSystemPrompt(stores: StoreInfo[]): string {
  const storeList = stores
    .filter(s => s.keywords) // Only exception stores have keywords
    .map(s => {
      const keywords = s.keywords?.split(',').map(k => k.trim()).join('", "') || s.name;
      return `- ID: "${s.id}" | słowa kluczowe: "${keywords}"`;
    })
    .join('\n');

  return `Jesteś asystentem do parsowania produktów spożywczych.

DOSTĘPNE SKLEPY (używaj dokładnie podanych ID):
${storeList || '(brak sklepów wyjątkowych)'}

Przekształć tekst na JSON z polami:
- name: nazwa produktu (normalized, capitalized)
- qty: ilość (liczba całkowita lub null)
- unit: jednostka miary (szt, kg, g, l, ml, opak) lub null
- note: dodatkowe informacje lub null
- category: jedna z kategorii: ${CATEGORIES.join(',')}
- storeId: ID sklepu z listy wyżej lub null jeśli brak dopasowania

Zasady:
- Użytkownik może wpisać "z DELI", "deli", "z deli" - wtedy storeId to "deli" (dokładnie takie ID jak w liście)
- Jeśli nie ma dopasowania do sklepu z listy, storeId = null
- Zawsze używaj dokładnego ID z listy, nie twórz nowych

Przykłady:
"mleko 10 sztuk, 3.2%" → {"name": "mleko", "qty": 10, "unit": "szt", "note": "3.2%", "category": "Nabiał", "storeId": null}
"kawa z DELI" → {"name": "kawa", "qty": null, "unit": null, "note": null, "category": "Napoje", "storeId": "deli"}

Zwróć TYLKO obiekt JSON.`;
}

export async function parseProductInput(
  input: string,
  availableStores: StoreInfo[]
): Promise<ParseResult> {
  const systemPrompt = buildSystemPrompt(availableStores);
  console.log(systemPrompt)
  const { text } = await generateText({
    model: openrouter(OPENROUTER_MODELS.GPT4O_MINI),
    system: systemPrompt,
    prompt: `Input: "${input}"\nOutput:`,
    maxOutputTokens: 200,
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
      storeId: null,
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
