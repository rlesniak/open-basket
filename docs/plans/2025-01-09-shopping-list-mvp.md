# Shopping List MVP - Implementation Plan

> **Goal:** Build a shopping list app with natural language input parsing and per-store category ordering using existing stack

**Architecture:** React Native (Expo) with local Drizzle ORM + OpenRouter AI for natural language parsing. HeroUI Native components with Uniwind styling.

**Tech Stack:** 
- Expo SDK 55, React Native 0.83
- Drizzle ORM + @libsql/client
- OpenRouter AI (gpt-4o-mini)
- HeroUI Native + Uniwind (Tailwind v4)
- ORPC (type-safe API)
- TanStack Query

---

## Core Features

1. **Natural Language Input** - "mleko 10 sztuk, 3.2%" → {name, qty, unit, note, category}
2. **Per-Store Category Ordering** - Each store has its own category sequence
3. **4 Predefined Stores** - Biedronka, Lidl, Kaufland, Auchan
4. **8 Predefined Categories** - Owoce, Warzywa, Nabiał, Mięso, Pieczywo, Napoje, Chemia, Słodycze
5. **Simple Purchase Flow** - Checkboxes, purchased items move to bottom section

---

## Task 1: Drizzle Schema

**Files:**
- Create: `packages/db/src/schema/shopping.ts`
- Modify: `packages/db/src/schema/index.ts`

```typescript
// packages/db/src/schema/shopping.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const storeCategoryOrders = sqliteTable('store_category_orders', {
  storeId: text('store_id').notNull(),
  categoryId: text('category_id').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  qty: integer('qty'), // Only whole numbers
  unit: text('unit'), // "szt", "kg", "l", etc.
  note: text('note'), // Additional info like "3.2%"
  categoryId: text('category_id').notNull(),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const DEFAULT_STORES = [
  { id: 'biedronka', name: 'Biedronka', orderIndex: 0 },
  { id: 'lidl', name: 'Lidl', orderIndex: 1 },
  { id: 'kaufland', name: 'Kaufland', orderIndex: 2 },
  { id: 'auchan', name: 'Auchan', orderIndex: 3 },
];

export const DEFAULT_CATEGORIES = [
  { id: 'owoce', name: 'Owoce' },
  { id: 'warzywa', name: 'Warzywa' },
  { id: 'nabial', name: 'Nabiał' },
  { id: 'mieso', name: 'Mięso' },
  { id: 'pieczywo', name: 'Pieczywo' },
  { id: 'napoje', name: 'Napoje' },
  { id: 'chemia', name: 'Chemia' },
  { id: 'slodycze', name: 'Słodycze' },
];
```

---

## Task 2: OpenRouter AI Parser

**Skill:** ai-sdk

**Files:**
- Create: `apps/server/src/lib/openrouter.ts`
- Create: `apps/server/src/lib/ai-parser.ts`

```typescript
// apps/server/src/lib/openrouter.ts
import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': 'https://open-basket.app',
    'X-Title': 'Open Basket Shopping App',
  },
});

export const OPENROUTER_MODELS = {
  GPT4O_MINI: 'openai/gpt-4o-mini',
} as const;
```

```typescript
// apps/server/src/lib/ai-parser.ts
import { generateText } from 'ai';
import { openrouter, OPENROUTER_MODELS } from './openrouter';
import { z } from 'zod';

const CATEGORIES = ['Owoce', 'Warzywa', 'Nabiał', 'Mięso', 'Pieczywo', 'Napoje', 'Chemia', 'Słodycze'] as const;

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
- name: nazwa produktu
- qty: ilość (liczba całkowita lub null)
- unit: jednostka miary (szt, kg, g, l, ml, opak) lub null
- note: dodatkowe informacje (marka, procent, wymagania) lub null
- category: jedna z kategorii

Przykłady:
Input: "mleko 10 sztuk, 3.2%" → {"name": "mleko", "qty": 10, "unit": "szt", "note": "3.2%", "category": "Nabiał"}
Input: "ziemniaki 3kg" → {"name": "ziemniaki", "qty": 3, "unit": "kg", "note": null, "category": "Warzywa"}
Input: "Woda mineralna 2 koniecznie z cisowianka" → {"name": "woda mineralna", "qty": 2, "unit": null, "note": "koniecznie z cisowianka", "category": "Napoje"}

Zwróć TYLKO obiekt JSON.`;

  const { text } = await generateText({
    model: openrouter(OPENROUTER_MODELS.GPT4O_MINI),
    system: systemPrompt,
    prompt: `Input: "${input}"\nOutput:`,
    maxTokens: 150,
    temperature: 0.1,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return ParseResultSchema.parse(parsed);
  } catch (error) {
    return {
      name: input,
      qty: null,
      unit: null,
      note: null,
      category: 'Inne' as any,
    };
  }
}
```

---

## Task 3: Main Shopping List Screen

**Skills:** heroui-native, native-data-fetching

**File:** `apps/native/app/(app)/index.tsx`

Key features:
- Natural language input: "mleko 10 sztuk, 3.2%"
- Store selector (Biedronka, Lidl, Kaufland, Auchan)
- Products grouped by category in store-specific order
- Checkboxes for marking purchased
- Purchased items moved to bottom section

Input examples:
- "mleko 10 sztuk, 3.2%" → name: mleko, qty: 10, unit: szt, note: 3.2%
- "ziemniaki 3kg" → name: ziemniaki, qty: 3, unit: kg
- "Woda mineralna 2 koniecznie z cisowianka" → name: woda mineralna, qty: 2, note: koniecznie z cisowianka

---

## Task 4: Settings Screens

**Files:**
- `apps/native/app/(app)/settings/index.tsx` - Store list
- `apps/native/app/(app)/settings/store/[id].tsx` - Category ordering

Features:
- List of 4 stores
- Reorder categories per store using up/down arrows
- Changes affect product grouping on main screen

---

## Implementation Order

1. **Task 1:** Drizzle Schema
2. **Task 2:** OpenRouter AI Parser
3. **Task 3:** ORPC API Routes
4. **Task 4:** Navigation Setup
5. **Task 5:** Main Shopping List Screen
6. **Task 6:** Settings Screens
7. **Task 7:** Global Styles & Testing

**All using existing dependencies - no new packages needed!**

**Ready to start implementation?**
