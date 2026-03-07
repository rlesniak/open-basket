import { generateText } from 'ai';
import { openrouter, OPENROUTER_MODELS } from './openrouter';
import { z } from 'zod';

const ParseResultSchema = z.object({
  name: z.string(),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  note: z.string().nullable(),
  categoryId: z.string(), // ID of matched category
  storeId: z.string().nullable(), // ID of matched store
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

export type StoreInfo = {
  id: string;
  name: string;
  keywords: string | null;
};

export type CategoryInfo = {
  id: string;
  name: string;
};

function buildSystemPrompt(stores: StoreInfo[], categories: CategoryInfo[]): string {
  const storeList = stores
    .filter(s => s.keywords) // Only exception stores have keywords
    .map(s => {
      const keywords = s.keywords?.split(',').map(k => k.trim()).join('", "') || s.name;
      return `- ID: "${s.id}" | słowa kluczowe: "${keywords}"`;
    })
    .join('\n');

  const categoryList = categories
    .map(c => `- ID: "${c.id}" | nazwa: "${c.name}"`)
    .join('\n');

  return `Jesteś ekspertem od kategoryzacji produktów spożywczych. Twoim zadaniem jest przypisanie każdego produktu do najbardziej pasującej kategorii z listy.

DOSTĘPNE KATEGORIE (używaj DOKŁADNIE podanych ID):
${categoryList}

DOSTĘPNE SKLEPY (używaj dokładnie podanych ID):
${storeList || '(brak sklepów wyjątkowych)'}

Przekształć tekst na JSON z polami:
- name: nazwa produktu (normalized, z dużej litery)
- qty: ilość (liczba całkowita lub null)
- unit: jednostka miary (szt, kg, g, l, ml, opak) lub null
- note: dodatkowe informacje lub null
- categoryId: ID kategorii z listy wyżej (MUSI być dokładnie takie jak w liście!)
- storeId: ID sklepu z listy wyżej lub null jeśli brak dopasowania

ZASADY KLASYFIKACJI KATEGORII:
- "owoce-warzywa" → jabłka, banany, ziemniaki, pomidory, sałata, marchew, cytrusy
- "pieczywo" → chleb, bułki, bagietka, pumpernikiel, chleb tostowy
- "pieczenie" → mąka, cukier, proszek do pieczenia, czekolada deserowa, kakao, drożdże
- "nabial-jajka" → mleko, ser, jogurt, masło, jajka, śmietana, kefir
- "sypkie" → ryż, makaron, kasza, płatki owsiane, cukier, soczewica
- "ryby" → łosoś, dorsz, makrela, tuńczyk (świeży lub w puszce), śledź
- "mrozonki" → lody, mrożone warzywa, pierogi mrożone, pizza mrożona
- "konserwy" → sardynki w puszce, groszek konserwowy, fasola w puszce, konfitury
- "mieso-wedliny" → kurczak, schab, kiełbasa, szynka, boczek, wołowina
- "slodycze-przekaski" → czekolada, batoniki, chipsy, żelki, orzeszki
- "przyprawy" → sól, pieprz, curry, ketchup, musztarda, olej, ocet, zioła
- "woda-napoje" → woda mineralna, soki, napoje gazowane, kompoty
- "kawa-herbata" → kawa ziarnista, kawa mielona, herbata czarna, zielona, ziołowa
- "alkohole" → piwo, wino, wódka, whisky, gin
- "higiena" → mydło, szampon, pasta do zębów, żel pod prysznic
- "dziecko" → pieluchy, mleko modyfikowane, chusteczki nawilżane, smoczki
- "apteczka" → bandaże, leki przeciwbólowe, termometr, plaster
- "dom-ogrod" → doniczki, nasiona, narzędzia ogrodowe, świece
- "czystosc" → płyn do naczyń, proszek do prania, zmywarki, środki dezynfekujące
- "inne" → tylko gdy produkt nie pasuje do żadnej innej kategorii

ZASADY SKLEPÓW:
- Użytkownik może wpisać "z DELI", "deli", "z deli" - wtedy storeId to "deli" (dokładnie takie ID jak w liście)
- Jeśli nie ma dopasowania do sklepu z listy, storeId = null

WAŻNE:
- Zawsze używaj dokładnego ID z listy, nie twórz nowych
- Nie używaj "inne" jeśli produkt pasuje do którejkolwiek kategorii
- Zwróć TYLKO obiekt JSON bez dodatkowych komentarzy

Przykłady:
"mleko 10 sztuk, 3.2%" → {"name": "Mleko", "qty": 10, "unit": "szt", "note": "3.2%", "categoryId": "nabial-jajka", "storeId": null}
"kawa z DELI" → {"name": "Kawa", "qty": null, "unit": null, "note": null, "categoryId": "kawa-herbata", "storeId": "deli"}
"masło promka" → {"name": "Masło", "qty": null, "unit": null, "note": "promka", "categoryId": "nabial-jajka", "storeId": null}
"jabłka kg" → {"name": "Jabłka", "qty": 1, "unit": "kg", "note": null, "categoryId": "owoce-warzywa", "storeId": null}
"piwo jasne" → {"name": "Piwo jasne", "qty": null, "unit": null, "note": null, "categoryId": "alkohole", "storeId": null}`;
}

export async function parseProductInput(
  input: string,
  availableStores: StoreInfo[],
  availableCategories: CategoryInfo[]
): Promise<ParseResult> {
  const systemPrompt = buildSystemPrompt(availableStores, availableCategories);
  console.log(systemPrompt)
  const { text } = await generateText({
    model: openrouter(OPENROUTER_MODELS.GEMINI_3_1_FLASH),
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
      categoryId: 'inne',
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
