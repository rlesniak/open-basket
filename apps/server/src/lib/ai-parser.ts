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
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

export async function parseProductInput(input: string): Promise<ParseResult> {
  const systemPrompt = `Jesteś asystentem do parsowania produktów spożywczych z języka naturalnego.

Twoim zadaniem jest przekształcenie tekstu użytkownika na strukturę JSON z polami:
- name: nazwa produktu (wymagane)
- qty: ilość (liczba całkowita lub null jeśli nie podano)
- unit: jednostka miary (szt, kg, g, l, ml, opak) lub null
- note: dodatkowe informacje (marka, procent, wymagania) lub null
- category: jedna z kategorii: ${CATEGORIES.join(',')}

Przykłady:
Input: "mleko 10 sztuk, 3.2%" → {"name": "mleko", "qty": 10, "unit": "szt", "note": "3.2%", "category": "Nabiał"}
Input: "ziemniaki 3kg" → {"name": "ziemniaki", "qty": 3, "unit": "kg", "note": null, "category": "Warzywa"}
Input: "Woda mineralna 2 koniecznie z cisowianka" → {"name": "woda mineralna", "qty": 2, "unit": null, "note": "koniecznie z cisowianka", "category": "Napoje"}

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
    };
  }
}
