# Lista Zakupów - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first shopping list app with AI-powered item extraction and store-specific category ordering.

**Architecture:** FSD (Feature Sliced Design) with entities (shopping-item, store, category) and features (add-item, item-list, store-selector, store-management). TanStack Start for server functions, TanStack Query for state management, Framer Motion for animations.

**Tech Stack:** TanStack Start, React 19, TypeScript, Tailwind, shadcn/ui, TanStack Query, Vercel AI SDK, Drizzle ORM, SQLite (libsql), Framer Motion

---

## Phase 1: Database Schema

### Task 1: Create Categories Schema

**Files:**
- Create: `packages/db/src/schema/categories.ts`
- Modify: `packages/db/src/index.ts`

**Step 1: Create categories table**

```typescript
// packages/db/src/schema/categories.ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
```

**Step 2: Add seed data for default categories**

```typescript
// packages/db/src/schema/categories.ts (append)
export const defaultCategories = [
  { name: 'Warzywa i owoce', icon: 'apple', color: '#22c55e' },
  { name: 'Nabiał', icon: 'milk', color: '#3b82f6' },
  { name: 'Mięso i ryby', icon: 'meat', color: '#ef4444' },
  { name: 'Piekarnia', icon: 'bread', color: '#f59e0b' },
  { name: 'Suche produkty', icon: 'package', color: '#8b5cf6' },
  { name: 'Mrożonki', icon: 'snowflake', color: '#06b6d4' },
  { name: 'Napoje', icon: 'bottle', color: '#ec4899' },
  { name: 'Chemia', icon: 'sparkles', color: '#6366f1' },
  { name: 'Inne', icon: 'box', color: '#6b7280' },
];
```

**Step 3: Export from index**

```typescript
// packages/db/src/index.ts
export * from './schema/categories';
```

**Step 4: Commit**

```bash
git add packages/db/src/schema/categories.ts packages/db/src/index.ts
git commit -m "feat(db): add categories schema with default categories"
```

---

### Task 2: Create Stores Schema

**Files:**
- Create: `packages/db/src/schema/stores.ts`
- Create: `packages/db/src/schema/store-categories.ts`

**Step 1: Create stores table**

```typescript
// packages/db/src/schema/stores.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
```

**Step 2: Create store-categories junction table**

```typescript
// packages/db/src/schema/store-categories.ts
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { stores } from './stores';
import { categories } from './categories';

export const storeCategories = sqliteTable(
  'store_categories',
  {
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.storeId, table.categoryId] }),
  })
);

export type StoreCategory = typeof storeCategories.$inferSelect;
export type NewStoreCategory = typeof storeCategories.$inferInsert;
```

**Step 3: Commit**

```bash
git add packages/db/src/schema/stores.ts packages/db/src/schema/store-categories.ts
git commit -m "feat(db): add stores and store-categories schemas"
```

---

### Task 3: Create Shopping Items Schema

**Files:**
- Create: `packages/db/src/schema/shopping-items.ts`

**Step 1: Create shopping_items table**

```typescript
// packages/db/src/schema/shopping-items.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { categories } from './categories';

export const itemStatusEnum = ['pending', 'purchased', 'cancelled'] as const;
export type ItemStatus = (typeof itemStatusEnum)[number];

export const shoppingItems = sqliteTable('shopping_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  quantity: text('quantity'),
  categoryId: text('category_id').references(() => categories.id, {
    onDelete: 'set default',
  }),
  note: text('note'),
  status: text('status', { enum: itemStatusEnum })
    .notNull()
    .$defaultFn(() => 'pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type NewShoppingItem = typeof shoppingItems.$inferInsert;
```

**Step 2: Commit**

```bash
git add packages/db/src/schema/shopping-items.ts
git commit -m "feat(db): add shopping-items schema"
```

---

### Task 4: Create Category Mappings Schema (AI Learning)

**Files:**
- Create: `packages/db/src/schema/category-mappings.ts`

**Step 1: Create category_mappings table**

```typescript
// packages/db/src/schema/category-mappings.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { categories } from './categories';

export const categoryMappings = sqliteTable('category_mappings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  inputPattern: text('input_pattern').notNull(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  frequency: integer('frequency').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type CategoryMapping = typeof categoryMappings.$inferSelect;
export type NewCategoryMapping = typeof categoryMappings.$inferInsert;
```

**Step 2: Update index.ts exports**

```typescript
// packages/db/src/index.ts
export * from './schema/categories';
export * from './schema/stores';
export * from './schema/store-categories';
export * from './schema/shopping-items';
export * from './schema/category-mappings';
```

**Step 3: Commit**

```bash
git add packages/db/src/schema/category-mappings.ts packages/db/src/index.ts
git commit -m "feat(db): add category-mappings schema for AI learning"
```

---

### Task 5: Database Migration

**Files:**
- Modify: `packages/db/drizzle.config.ts` (if needed)

**Step 1: Run migration**

```bash
cd /Users/rafal/workspace/open-basket
bun db:push
```

**Expected output:** All tables created successfully

**Step 2: Verify with studio**

```bash
bun db:studio
```

Check that all tables appear correctly.

**Step 3: Commit**

```bash
git add .
git commit -m "chore(db): migrate database schema"
```

---

## Phase 2: Entities Layer

### Task 6: Category Entity

**Files:**
- Create: `apps/web/src/entities/category/model.ts`
- Create: `apps/web/src/entities/category/api.ts`
- Create: `apps/web/src/entities/category/queries.ts`

**Step 1: Create model types**

```typescript
// apps/web/src/entities/category/model.ts
import type { Category } from '@open-basket/db';

export type { Category };

export interface CategoryWithPosition extends Category {
  position: number;
}
```

**Step 2: Create API (server functions)**

```typescript
// apps/web/src/entities/category/api.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@open-basket/db';
import { categories } from '@open-basket/db';

export const getCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(categories).orderBy(categories.name);
  }
);
```

**Step 3: Create TanStack Query hooks**

```typescript
// apps/web/src/entities/category/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { getCategories } from './api';

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });
```

**Step 4: Commit**

```bash
git add apps/web/src/entities/category/
git commit -m "feat(entities): add category entity with queries"
```

---

### Task 7: Store Entity

**Files:**
- Create: `apps/web/src/entities/store/model.ts`
- Create: `apps/web/src/entities/store/api.ts`
- Create: `apps/web/src/entities/store/queries.ts`

**Step 1: Create model types**

```typescript
// apps/web/src/entities/store/model.ts
import type { Store, Category } from '@open-basket/db';

export type { Store };

export interface StoreWithCategories extends Store {
  categories: Array<{
    category: Category;
    position: number;
  }>;
}
```

**Step 2: Create API**

```typescript
// apps/web/src/entities/store/api.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@open-basket/db';
import { stores, storeCategories, categories } from '@open-basket/db';
import { eq } from 'drizzle-orm';

export const getStores = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(stores).orderBy(stores.name);
});

export const getStoreWithCategories = createServerFn({ method: 'GET' })
  .validator((storeId: string) => storeId)
  .handler(async ({ data: storeId }) => {
    const store = await db.select().from(stores).where(eq(stores.id, storeId)).get();
    if (!store) return null;

    const cats = await db
      .select({
        category: categories,
        position: storeCategories.position,
      })
      .from(storeCategories)
      .innerJoin(categories, eq(storeCategories.categoryId, categories.id))
      .where(eq(storeCategories.storeId, storeId))
      .orderBy(storeCategories.position);

    return { ...store, categories: cats };
  });

export const createStore = createServerFn({ method: 'POST' })
  .validator((name: string) => name)
  .handler(async ({ data: name }) => {
    const allCategories = await db.select().from(categories);
    
    const store = await db
      .insert(stores)
      .values({ name })
      .returning()
      .get();

    // Add all categories with default order
    await db.insert(storeCategories).values(
      allCategories.map((cat, index) => ({
        storeId: store.id,
        categoryId: cat.id,
        position: index,
      }))
    );

    return store;
  });

export const updateCategoryOrder = createServerFn({ method: 'POST' })
  .validator((data: { storeId: string; categoryId: string; position: number }) => data)
  .handler(async ({ data }) => {
    await db
      .update(storeCategories)
      .set({ position: data.position })
      .where(eq(storeCategories.storeId, data.storeId))
      .where(eq(storeCategories.categoryId, data.categoryId));
  });
```

**Step 3: Create queries**

```typescript
// apps/web/src/entities/store/queries.ts
import { queryOptions } from '@tanstack/react-query';
import { getStores, getStoreWithCategories } from './api';

export const storesQueryOptions = () =>
  queryOptions({
    queryKey: ['stores'],
    queryFn: () => getStores(),
  });

export const storeWithCategoriesQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: ['stores', storeId, 'categories'],
    queryFn: () => getStoreWithCategories({ data: storeId }),
    enabled: !!storeId,
  });
```

**Step 4: Commit**

```bash
git add apps/web/src/entities/store/
git commit -m "feat(entities): add store entity with category ordering"
```

---

### Task 8: Shopping Item Entity

**Files:**
- Create: `apps/web/src/entities/shopping-item/model.ts`
- Create: `apps/web/src/entities/shopping-item/api.ts`
- Create: `apps/web/src/entities/shopping-item/queries.ts`

**Step 1: Create model types**

```typescript
// apps/web/src/entities/shopping-item/model.ts
import type { ShoppingItem, Category } from '@open-basket/db';

export type { ShoppingItem, ItemStatus } from '@open-basket/db';

export interface ShoppingItemWithCategory extends ShoppingItem {
  category: Category | null;
}

export type CreateShoppingItemInput = {
  name: string;
  quantity?: string | null;
  categoryId?: string | null;
  note?: string | null;
};

export type UpdateShoppingItemInput = Partial<CreateShoppingItemInput> & {
  status?: 'pending' | 'purchased' | 'cancelled';
};
```

**Step 2: Create API**

```typescript
// apps/web/src/entities/shopping-item/api.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@open-basket/db';
import { shoppingItems, categories, categoryMappings } from '@open-basket/db';
import { eq, desc, sql } from 'drizzle-orm';
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from './model';

export const getShoppingItems = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db
      .select({
        item: shoppingItems,
        category: categories,
      })
      .from(shoppingItems)
      .leftJoin(categories, eq(shoppingItems.categoryId, categories.id))
      .orderBy(desc(shoppingItems.createdAt));
  }
);

export const createShoppingItem = createServerFn({ method: 'POST' })
  .validator((input: CreateShoppingItemInput) => input)
  .handler(async ({ data }) => {
    return db
      .insert(shoppingItems)
      .values({
        name: data.name,
        quantity: data.quantity,
        categoryId: data.categoryId,
        note: data.note,
        status: 'pending',
      })
      .returning()
      .get();
  });

export const updateShoppingItem = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: UpdateShoppingItemInput }) => data)
  .handler(async ({ data }) => {
    const { id, input } = data;
    
    // If category changed, update learning
    if (input.categoryId && input.name) {
      await updateCategoryMapping(input.name, input.categoryId);
    }

    return db
      .update(shoppingItems)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(shoppingItems.id, id))
      .returning()
      .get();
  });

export const deleteShoppingItem = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
  });

async function updateCategoryMapping(inputPattern: string, categoryId: string) {
  const existing = await db
    .select()
    .from(categoryMappings)
    .where(eq(categoryMappings.inputPattern, inputPattern.toLowerCase()))
    .get();

  if (existing) {
    await db
      .update(categoryMappings)
      .set({ frequency: existing.frequency + 1 })
      .where(eq(categoryMappings.id, existing.id));
  } else {
    await db.insert(categoryMappings).values({
      inputPattern: inputPattern.toLowerCase(),
      categoryId,
      frequency: 1,
    });
  }
}
```

**Step 3: Create queries**

```typescript
// apps/web/src/entities/shopping-item/queries.ts
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getShoppingItems,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
} from './api';
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from './model';

export const shoppingItemsQueryOptions = () =>
  queryOptions({
    queryKey: ['shopping-items'],
    queryFn: () => getShoppingItems(),
  });

export function useCreateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShoppingItemInput) =>
      createShoppingItem({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
    },
  });
}

export function useUpdateShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; input: UpdateShoppingItemInput }) =>
      updateShoppingItem({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
    },
  });
}

export function useDeleteShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteShoppingItem({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
    },
  });
}
```

**Step 4: Commit**

```bash
git add apps/web/src/entities/shopping-item/
git commit -m "feat(entities): add shopping-item entity with CRUD"
```

---

## Phase 3: AI Integration

### Task 9: AI Client Setup

**Files:**
- Create: `apps/web/src/shared/lib/ai-client.ts`

**Step 1: Install AI SDK**

```bash
cd apps/web
bun add ai @ai-sdk/openai
```

**Step 2: Create AI client**

```typescript
// apps/web/src/shared/lib/ai-client.ts
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const aiModel = openai('gpt-4o-mini');
```

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/src/shared/lib/ai-client.ts bun.lock
git commit -m "feat(ai): setup OpenAI client with gpt-4o-mini"
```

---

### Task 10: AI Extraction Logic

**Files:**
- Create: `apps/web/src/features/add-item/ai-extraction.ts`

**Step 1: Create extraction schema**

```typescript
// apps/web/src/features/add-item/ai-extraction.ts
import { z } from 'zod';

export const extractionSchema = z.object({
  name: z.string().describe('The product name'),
  quantity: z.string().nullable().describe('Quantity with unit, e.g., "2 kg", "3 pieces", "500ml"'),
  category: z.string().describe('Best matching category from the available list'),
  note: z.string().nullable().describe('Any additional notes or context'),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
```

**Step 2: Create server function for extraction**

```typescript
// apps/web/src/features/add-item/ai-extraction.ts (append)
import { createServerFn } from '@tanstack/react-start';
import { generateObject } from 'ai';
import { aiModel } from '@/shared/lib/ai-client';
import { db, categories, categoryMappings } from '@open-basket/db';
import { eq, desc } from 'drizzle-orm';

const SYSTEM_PROMPT = `Extract shopping item details from user input.
Available categories: {categories}

Respond with JSON containing:
- name: product name
- quantity: amount with unit (or null if not specified)
- category: best matching category name from the list
- note: any additional context (or null)

Examples:
"2 kg jabłek na szarlotkę" → {name: "jabłka", quantity: "2 kg", category: "Warzywa i owoce", note: "na szarlotkę"}
"mleko" → {name: "mleko", quantity: null, category: "Nabiał", note: null}`;

export const extractItemDetails = createServerFn({ method: 'POST' })
  .validator((input: { text: string; allCategories: string[] }) => input)
  .handler(async ({ data }) => {
    try {
      // Get learned mappings for similar inputs
      const learnedMappings = await db
        .select()
        .from(categoryMappings)
        .orderBy(desc(categoryMappings.frequency))
        .limit(10);

      const context = learnedMappings.length > 0
        ? `\n\nLearned patterns:\n${learnedMappings.map(m => `"${m.inputPattern}" → ${m.categoryId}`).join('\n')}`
        : '';

      const prompt = SYSTEM_PROMPT.replace(
        '{categories}',
        data.allCategories.join(', ')
      ) + context;

      const { object } = await generateObject({
        model: aiModel,
        schema: extractionSchema,
        prompt: `${prompt}\n\nInput: "${data.text}"`,
      });

      return object;
    } catch (error) {
      console.error('AI extraction failed:', error);
      // Fallback: return input as name
      return {
        name: data.text,
        quantity: null,
        category: 'Inne',
        note: null,
      };
    }
  });
```

**Step 3: Commit**

```bash
git add apps/web/src/features/add-item/ai-extraction.ts
git commit -m "feat(ai): add item extraction with fallback"
```

---

## Phase 4: Features

### Task 11: Add Item Feature

**Files:**
- Create: `apps/web/src/features/add-item/use-add-item.ts`
- Create: `apps/web/src/features/add-item/add-item-input.tsx`

**Step 1: Create hook for adding items**

```typescript
// apps/web/src/features/add-item/use-add-item.ts
import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { extractItemDetails } from './ai-extraction';
import { createShoppingItem } from '@/entities/shopping-item/api';
import { categoriesQueryOptions } from '@/entities/category/queries';
import type { ExtractionResult } from './ai-extraction';

interface UseAddItemReturn {
  input: string;
  setInput: (value: string) => void;
  isProcessing: boolean;
  suggestions: string[];
  handleSubmit: () => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
}

export function useAddItem(): UseAddItemReturn {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery(categoriesQueryOptions());

  const addItemMutation = useMutation({
    mutationFn: createShoppingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-items'] });
    },
  });

  const suggestions = [];

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);

    // Optimistic: Add item immediately with raw input
    const tempItem = await addItemMutation.mutateAsync({
      data: {
        name: input,
        quantity: null,
        categoryId: null,
        note: null,
      },
    });

    try {
      // Extract with AI
      const categoryNames = categories?.map((c) => c.name) || [];
      const extracted = await extractItemDetails({
        data: { text: input, allCategories: categoryNames },
      });

      // Find category ID
      const category = categories?.find((c) => c.name === extracted.category);

      // Update with extracted data
      await addItemMutation.mutateAsync({
        data: {
          name: extracted.name,
          quantity: extracted.quantity,
          categoryId: category?.id || null,
          note: extracted.note,
        },
      });
    } catch (error) {
      // Item stays with raw input as name
      console.error('Extraction failed:', error);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return {
    input,
    setInput,
    isProcessing,
    suggestions,
    handleSubmit,
    handleSuggestionClick,
  };
}
```

**Step 2: Create add item input component**

```typescript
// apps/web/src/features/add-item/add-item-input.tsx
import { useState } from 'react';
import { useAddItem } from './use-add-item';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

export function AddItemInput() {
  const { input, setInput, isProcessing, handleSubmit } = useAddItem();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form onSubmit={onSubmit} className="sticky bottom-0 bg-background p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="np. 2 kg jabłek na szarlotkę"
          disabled={isProcessing}
          className="flex-1"
        />
        <Button type="submit" disabled={isProcessing || !input.trim()}>
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/features/add-item/
git commit -m "feat(features): add add-item feature with AI extraction"
```

---

### Task 12: Item List Feature

**Files:**
- Create: `apps/web/src/features/item-list/item-card.tsx`
- Create: `apps/web/src/features/item-list/item-actions.tsx`
- Create: `apps/web/src/features/item-list/item-list.tsx`

**Step 1: Create item card component**

```typescript
// apps/web/src/features/item-list/item-card.tsx
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { ShoppingItemWithCategory } from '@/entities/shopping-item/model';

interface ItemCardProps {
  item: ShoppingItemWithCategory;
  onToggle: () => void;
}

export function ItemCard({ item, onToggle }: ItemCardProps) {
  const isPurchased = item.status === 'purchased';

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-card rounded-lg border ${
        isPurchased ? 'opacity-60' : ''
      }`}
    >
      <Checkbox checked={isPurchased} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            isPurchased ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {item.name}
        </p>
        {(item.quantity || item.note) && (
          <p className="text-sm text-muted-foreground truncate">
            {[item.quantity, item.note].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
      {item.category && (
        <span
          className="px-2 py-1 text-xs rounded-full"
          style={{
            backgroundColor: item.category.color + '20',
            color: item.category.color,
          }}
        >
          {item.category.name}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Create item actions component**

```typescript
// apps/web/src/features/item-list/item-actions.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { MoreVertical, Trash2, Edit } from 'lucide-react';

interface ItemActionsProps {
  onDelete: () => void;
  onEdit: () => void;
}

export function ItemActions({ onDelete, onEdit }: ItemActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edytuj
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 3: Create item list component**

```typescript
// apps/web/src/features/item-list/item-list.tsx
import { useQuery } from '@tanstack/react-query';
import { shoppingItemsQueryOptions, useUpdateShoppingItem, useDeleteShoppingItem } from '@/entities/shopping-item/queries';
import { storeWithCategoriesQueryOptions } from '@/entities/store/queries';
import { ItemCard } from './item-card';
import { ItemActions } from './item-actions';

interface ItemListProps {
  selectedStoreId: string | null;
}

export function ItemList({ selectedStoreId }: ItemListProps) {
  const { data: items } = useQuery(shoppingItemsQueryOptions());
  const { data: storeWithCategories } = useQuery(
    storeWithCategoriesQueryOptions(selectedStoreId || '')
  );

  const updateMutation = useUpdateShoppingItem();
  const deleteMutation = useDeleteShoppingItem();

  // Group items by category
  const groupedItems = items?.reduce((acc, { item, category }) => {
    const categoryName = category?.name || 'Inne';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push({ ...item, category });
    return acc;
  }, {} as Record<string, ShoppingItemWithCategory[]>);

  // Sort categories by store order
  const sortedCategories = storeWithCategories?.categories || [];
  const categoryOrder = new Map(
    sortedCategories.map((c) => [c.category.name, c.position])
  );

  const pendingItems = items?.filter(({ item }) => item.status === 'pending') || [];
  const purchasedItems = items?.filter(({ item }) => item.status === 'purchased') || [];

  const handleToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'purchased' ? 'pending' : 'purchased';
    updateMutation.mutate({ id, input: { status: newStatus } });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Pending items grouped by category */}
      {sortedCategories.map(({ category }) => {
        const categoryItems = groupedItems?.[category.name]?.filter(
          (item) => item.status === 'pending'
        );

        if (!categoryItems?.length) return null;

        return (
          <div key={category.id}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
              {category.name}
            </h3>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <ItemCard
                      item={item}
                      onToggle={() => handleToggle(item.id, item.status)}
                    />
                  </div>
                  <ItemActions
                    onDelete={() => deleteMutation.mutate(item.id)}
                    onEdit={() => {/* TODO: Edit modal */}}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Purchased items */}
      {purchasedItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
            Kupione ({purchasedItems.length})
          </h3>
          <div className="space-y-2">
            {purchasedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <ItemCard
                    item={item}
                    onToggle={() => handleToggle(item.id, item.status)}
                  />
                </div>
                <ItemActions
                  onDelete={() => deleteMutation.mutate(item.id)}
                  onEdit={() => {/* TODO: Edit modal */}}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/features/item-list/
git commit -m "feat(features): add item-list feature with grouping and actions"
```

---

### Task 13: Store Selector Feature

**Files:**
- Create: `apps/web/src/features/store-selector/store-selector.tsx`
- Create: `apps/web/src/features/store-selector/store-dropdown.tsx`

**Step 1: Create store dropdown**

```typescript
// apps/web/src/features/store-selector/store-dropdown.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { storesQueryOptions } from '@/entities/store/queries';

interface StoreDropdownProps {
  value: string | null;
  onChange: (value: string) => void;
}

export function StoreDropdown({ value, onChange }: StoreDropdownProps) {
  const { data: stores } = useQuery(storesQueryOptions());

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Wybierz sklep" />
      </SelectTrigger>
      <SelectContent>
        {stores?.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 2: Create store selector**

```typescript
// apps/web/src/features/store-selector/store-selector.tsx
import { StoreDropdown } from './store-dropdown';
import { Button } from '@/shared/components/ui/button';
import { Settings } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface StoreSelectorProps {
  selectedStoreId: string | null;
  onStoreChange: (storeId: string) => void;
}

export function StoreSelector({ selectedStoreId, onStoreChange }: StoreSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-4 border-b">
      <div className="flex-1">
        <StoreDropdown value={selectedStoreId} onChange={onStoreChange} />
      </div>
      <Link to="/stores">
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/features/store-selector/
git commit -m "feat(features): add store-selector feature"
```

---

### Task 14: Store Management Feature

**Files:**
- Create: `apps/web/src/features/store-management/store-list.tsx`
- Create: `apps/web/src/features/store-management/create-store-form.tsx`
- Create: `apps/web/src/features/store-management/category-order-editor.tsx`

**Step 1: Create store list**

```typescript
// apps/web/src/features/store-management/store-list.tsx
import { useQuery } from '@tanstack/react-query';
import { storesQueryOptions } from '@/entities/store/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Store } from 'lucide-react';

interface StoreListProps {
  onSelectStore: (storeId: string) => void;
  selectedStoreId: string | null;
}

export function StoreList({ onSelectStore, selectedStoreId }: StoreListProps) {
  const { data: stores } = useQuery(storesQueryOptions());

  return (
    <div className="space-y-3">
      {stores?.map((store) => (
        <Card
          key={store.id}
          className={`cursor-pointer transition-colors ${
            selectedStoreId === store.id ? 'border-primary' : ''
          }`}
          onClick={() => onSelectStore(store.id)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{store.name}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Step 2: Create store form**

```typescript
// apps/web/src/features/store-management/create-store-form.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStore } from '@/entities/store/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Plus } from 'lucide-react';

export function CreateStoreForm() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (storeName: string) => createStore({ data: storeName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setName('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      mutation.mutate(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nazwa nowego sklepu"
        disabled={mutation.isPending}
      />
      <Button type="submit" disabled={mutation.isPending || !name.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
```

**Step 3: Create category order editor**

```typescript
// apps/web/src/features/store-management/category-order-editor.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeWithCategoriesQueryOptions } from '@/entities/store/queries';
import { updateCategoryOrder } from '@/entities/store/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

interface CategoryOrderEditorProps {
  storeId: string;
}

export function CategoryOrderEditor({ storeId }: CategoryOrderEditorProps) {
  const { data: store } = useQuery(storeWithCategoriesQueryOptions(storeId));
  const queryClient = useQueryClient();

  const [localOrder, setLocalOrder] = useState(
    store?.categories || []
  );

  const mutation = useMutation({
    mutationFn: (data: { categoryId: string; position: number }) =>
      updateCategoryOrder({ data: { storeId, ...data } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores', storeId] });
    },
  });

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localOrder.length) return;

    const newOrder = [...localOrder];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    setLocalOrder(newOrder);

    // Update positions
    newOrder.forEach((item, idx) => {
      if (item.position !== idx) {
        mutation.mutate({ categoryId: item.category.id, position: idx });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kolejność kategorii</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {localOrder.map((item, index) => (
          <div
            key={item.category.id}
            className="flex items-center gap-2 p-2 bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">{item.category.name}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveCategory(index, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveCategory(index, 'down')}
                disabled={index === localOrder.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/features/store-management/
git commit -m "feat(features): add store-management feature with category ordering"
```

---

## Phase 5: Routes

### Task 15: Main Page Route

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

**Step 1: Update main page**

```typescript
// apps/web/src/routes/index.tsx
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { StoreSelector } from '@/features/store-selector/store-selector';
import { ItemList } from '@/features/item-list/item-list';
import { AddItemInput } from '@/features/add-item/add-item-input';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <StoreSelector
        selectedStoreId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
      />
      <main className="flex-1 p-4 overflow-auto">
        <ItemList selectedStoreId={selectedStoreId} />
      </main>
      <AddItemInput />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "feat(routes): update main page with all features"
```

---

### Task 16: Stores Management Route

**Files:**
- Create: `apps/web/src/routes/stores.tsx`

**Step 1: Create stores page**

```typescript
// apps/web/src/routes/stores.tsx
import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { StoreList } from '@/features/store-management/store-list';
import { CreateStoreForm } from '@/features/store-management/create-store-form';
import { CategoryOrderEditor } from '@/features/store-management/category-order-editor';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/stores')({
  component: StoresPage,
});

function StoresPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Zarządzaj sklepami</h1>
      </div>

      <div className="space-y-6">
        <CreateStoreForm />

        <div className="grid gap-6 lg:grid-cols-2">
          <StoreList
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
          />

          {selectedStoreId && (
            <CategoryOrderEditor storeId={selectedStoreId} />
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/stores.tsx
git commit -m "feat(routes): add stores management page"
```

---

## Phase 6: Polish & Testing

### Task 17: Add Default Store Seed

**Files:**
- Modify: `packages/db/src/index.ts`

**Step 1: Add seed function**

```typescript
// packages/db/src/index.ts (append)
import { db } from './client';
import { stores, categories, storeCategories, defaultCategories } from './schema';

export async function seedDatabase() {
  // Check if we have categories
  const existingCategories = await db.select().from(categories);
  
  if (existingCategories.length === 0) {
    // Insert default categories
    await db.insert(categories).values(defaultCategories);
  }

  // Check if we have stores
  const existingStores = await db.select().from(stores);
  
  if (existingStores.length === 0) {
    // Create default store
    const defaultStore = await db
      .insert(stores)
      .values({ name: 'Mój sklep' })
      .returning()
      .get();

    // Add all categories to default store
    const allCategories = await db.select().from(categories);
    await db.insert(storeCategories).values(
      allCategories.map((cat, index) => ({
        storeId: defaultStore.id,
        categoryId: cat.id,
        position: index,
      }))
    );
  }
}
```

**Step 2: Call seed on app start**

This should be called in the root route loader or app initialization.

**Step 3: Commit**

```bash
git add packages/db/src/index.ts
git commit -m "feat(db): add database seeding for default data"
```

---

### Task 18: Run Type Check

**Step 1: Check types**

```bash
bun check-types
```

**Expected:** No type errors

**Step 2: Fix any issues**

Address any type errors that appear.

**Step 3: Commit**

```bash
git add .
git commit -m "chore: fix type errors"
```

---

### Task 19: Run Linter

**Step 1: Run linter**

```bash
bun check
```

**Step 2: Auto-fix issues**

```bash
bun fix
```

**Step 3: Commit**

```bash
git add .
git commit -m "style: fix linting issues"
```

---

### Task 20: Test Application

**Step 1: Start dev server**

```bash
bun dev
```

**Step 2: Manual testing checklist**

- [ ] Add item via AI ("2 kg jabłek na szarlotkę")
- [ ] Check if item appears with correct category
- [ ] Mark item as purchased
- [ ] Check if item moves to "Kupione" section
- [ ] Delete item
- [ ] Create new store
- [ ] Change category order in store
- [ ] Switch between stores
- [ ] Verify category order changes in list

**Step 3: Fix any bugs**

Address issues found during testing.

**Step 4: Final commit**

```bash
git add .
git commit -m "fix: address bugs from manual testing"
```

---

## Summary

This implementation plan covers:

1. **Database Schema** - All tables with proper relations
2. **Entities Layer** - Category, Store, ShoppingItem with queries
3. **AI Integration** - Extraction logic with fallback
4. **Features** - Add item, Item list, Store selector, Store management
5. **Routes** - Main page and stores management page
6. **Polish** - Seeding, type checking, linting, testing

**Estimated time:** 4-6 hours

**Dependencies:**
- OpenAI API key for AI extraction
- Database running (local or Turso)

**Next steps:**
- Execute plan task-by-task using executing-plans skill
- Or dispatch parallel subagents for independent tasks
