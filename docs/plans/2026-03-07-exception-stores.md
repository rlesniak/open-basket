# Exception Stores Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add support for "exception stores" where products can be assigned to specific stores and are only visible in those stores, with AI parsing store keywords from natural language input.

**Architecture:** Extend existing shopping schema with `assignedStoreId` on products and `keywords` on stores. Modify UI to show store-filtered products and enhance AI parser to extract store keywords.

**Tech Stack:** Expo + Drizzle ORM + ORPC + TanStack Query + HeroUI Native + OpenRouter AI

---

## Task 1: Update Database Schema

**Files:**
- Modify: `packages/db/src/schema/shopping.ts`

**Step 1: Add keywords field to stores table**

```typescript
export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  keywords: text('keywords'), // Comma-separated keywords like "deli,z deli"
});
```

**Step 2: Add assignedStoreId to products table**

```typescript
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  qty: integer('qty'),
  unit: text('unit'),
  note: text('note'),
  categoryId: text('category_id').notNull(),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(false),
  assignedStoreId: text('assigned_store_id'), // null = global product, else specific store
  createdAt: integer('created_at').notNull(),
});
```

**Step 3: Run database migration**

```bash
cd /Users/rafal/workspace/listonic
npm run db:push
```

Expected: Migration succeeds, new columns added.

**Step 4: Commit**

```bash
git add packages/db/src/schema/shopping.ts
git commit -m "feat(db): add assignedStoreId to products and keywords to stores"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `apps/native/types/shopping.ts`

**Step 1: Update Product type**

```typescript
export type Product = {
  id: string;
  name: string;
  qty: number | null;
  unit: string | null;
  note: string | null;
  categoryId: string;
  isPurchased: boolean;
  assignedStoreId: string | null; // NEW
  createdAt: number;
};
```

**Step 2: Update Store type**

```typescript
export type Store = {
  id: string;
  name: string;
  orderIndex: number;
  keywords: string | null; // NEW
};
```

**Step 3: Commit**

```bash
git add apps/native/types/shopping.ts
git commit -m "feat(types): add assignedStoreId and keywords fields"
```

---

## Task 3: Update ORPC API Router

**Files:**
- Modify: `packages/api/src/shopping.ts`

**Step 1: Update StoreSchema and ProductSchema**

```typescript
const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderIndex: z.number(),
  keywords: z.string().nullable(), // NEW
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  note: z.string().nullable(),
  categoryId: z.string(),
  isPurchased: z.boolean(),
  assignedStoreId: z.string().nullable(), // NEW
  createdAt: z.number(),
});
```

**Step 2: Add createExceptionStore procedure**

```typescript
const createExceptionStore = o
  .input(z.object({
    name: z.string(),
    keywords: z.string(),
  }))
  .output(StoreSchema)
  .handler(async ({ input }) => {
    const id = input.name.toLowerCase().replace(/\s+/g, '-');
    const maxOrder = await db
      .select({ maxOrder: stores.orderIndex })
      .from(stores)
      .orderBy(stores.orderIndex)
      .then(rows => rows[rows.length - 1]?.maxOrder ?? 0);
    
    const newStore = {
      id,
      name: input.name,
      orderIndex: maxOrder + 1,
      keywords: input.keywords,
    };
    
    await db.insert(stores).values(newStore);
    return newStore;
  });
```

**Step 3: Update addProduct to handle assignedStoreId**

```typescript
const addProduct = o
  .input(z.object({
    name: z.string(),
    qty: z.number().nullable(),
    unit: z.string().nullable(),
    note: z.string().nullable(),
    categoryId: z.string(),
    assignedStoreId: z.string().nullable(), // NEW
  }))
  .output(ProductSchema)
  .handler(async ({ input }) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    
    const newProduct = {
      id,
      name: input.name,
      qty: input.qty,
      unit: input.unit,
      note: input.note,
      categoryId: input.categoryId,
      assignedStoreId: input.assignedStoreId, // NEW
      isPurchased: false,
      createdAt,
    };
    
    await db.insert(products).values(newProduct);
    return newProduct;
  });
```

**Step 4: Update updateProduct to handle assignedStoreId**

```typescript
const updateProduct = o
  .input(z.object({
    productId: z.string(),
    name: z.string(),
    qty: z.number().nullable(),
    unit: z.string().nullable(),
    note: z.string().nullable(),
    categoryId: z.string(),
    assignedStoreId: z.string().nullable(), // NEW
  }))
  .output(ProductSchema)
  .handler(async ({ input }) => {
    await db
      .update(products)
      .set({
        name: input.name,
        qty: input.qty,
        unit: input.unit,
        note: input.note,
        categoryId: input.categoryId,
        assignedStoreId: input.assignedStoreId, // NEW
      })
      .where(eq(products.id, input.productId));

    const updatedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
      .then(rows => rows[0]);

    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    return updatedProduct;
  });
```

**Step 5: Update shoppingRouter exports**

```typescript
export const shoppingRouter = {
  getStores,
  createExceptionStore, // NEW
  getCategories,
  getStoreCategoryOrders,
  updateCategoryOrder,
  getProducts,
  addProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  clearPurchased,
};
```

**Step 6: Commit**

```bash
git add packages/api/src/shopping.ts
git commit -m "feat(api): add exception store support with assignedStoreId"
```

---

## Task 4: Enhance AI Parser for Store Detection

**Files:**
- Modify: `apps/server/src/lib/ai-parser.ts`

**Step 1: Extend ParseResult type**

```typescript
export const ParseResultSchema = z.object({
  name: z.string(),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  note: z.string().nullable(),
  category: z.enum(CATEGORIES),
  store: z.string().nullable(), // NEW: extracted store name/keyword
});
```

**Step 2: Update system prompt to include store detection**

```typescript
export async function parseProductInput(input: string): Promise<ParseResult> {
  const systemPrompt = `Jesteś asystentem do parsowania produktów spożywczych.

Przekształć tekst na JSON z polami:
- name: nazwa produktu
- qty: ilość (liczba całkowita lub null)
- unit: jednostka miary (szt, kg, g, l, ml, opak) lub null
- note: dodatkowe informacje lub null
- category: jedna z kategorii
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

  // ... rest of implementation
}
```

**Step 3: Add getStoresWithKeywords function for server**

```typescript
// In apps/server/src/lib/ai-parser.ts or shopping.ts
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
```

**Step 4: Commit**

```bash
git add apps/server/src/lib/ai-parser.ts
git commit -m "feat(ai): add store detection to natural language parser"
```

---

## Task 5: Update Server Route for Store-Aware Parsing

**Files:**
- Modify: `apps/server/src/routes/shopping.ts`

**Step 1: Add endpoint to get stores with keywords**

```typescript
import { db } from '@listonic/db';
import { stores } from '@listonic/db/schema';

// Add GET endpoint
shoppingRoute.get('/stores', async (c) => {
  const allStores = await db.select().from(stores).orderBy(stores.orderIndex);
  return c.json({ success: true, data: allStores });
});

// Add POST endpoint for parsing with store detection
shoppingRoute.post('/parse-product-with-store', zValidator('json', parseSchema), async (c) => {
  const { input } = c.req.valid('json');
  
  try {
    const parsed = await parseProductInput(input);
    
    // Get all stores to match against keywords
    const allStores = await db.select().from(stores);
    const matchedStoreId = await matchStoreFromKeywords(parsed.store, allStores);
    
    return c.json({ 
      success: true, 
      data: { 
        ...parsed, 
        assignedStoreId: matchedStoreId 
      } 
    });
  } catch (error) {
    console.error('Parse error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to parse product' 
    }, 500);
  }
});
```

**Step 2: Commit**

```bash
git add apps/server/src/routes/shopping.ts
git commit -m "feat(server): add store-aware product parsing endpoint"
```

---

## Task 6: Update React Native Hooks

**Files:**
- Modify: `apps/native/hooks/shopping/useShopping.ts`

**Step 1: Add createExceptionStore mutation**

```typescript
export const useCreateExceptionStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; keywords: string }) =>
      client.shopping.createExceptionStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getStores'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
};
```

**Step 2: Update useAddProduct to handle assignedStoreId**

```typescript
export const useAddProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { 
      name: string; 
      qty: number | null; 
      unit: string | null; 
      note: string | null; 
      categoryId: string;
      assignedStoreId?: string | null; // NEW
    }) => 
      client.shopping.addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping', 'getProducts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
};
```

**Step 3: Add useFilteredProducts hook**

```typescript
export const useFilteredProducts = (selectedStoreId: string) => {
  const { data: products = [], ...rest } = useProducts();
  
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // If product has no assigned store, it's global - show everywhere
      if (!product.assignedStoreId) return true;
      // If product has assigned store, only show in that store
      return product.assignedStoreId === selectedStoreId;
    });
  }, [products, selectedStoreId]);
  
  return { data: filteredProducts, ...rest };
};
```

**Step 4: Commit**

```bash
git add apps/native/hooks/shopping/useShopping.ts
git commit -m "feat(hooks): add exception store hooks and filtered products"
```

---

## Task 7: Update Product Parser Hook

**Files:**
- Modify: `apps/native/hooks/shopping/useProductParser.ts`

**Step 1: Update to parse store from input**

```typescript
import { useState } from 'react';
import { client } from '@/utils/orpc';

export const useProductParser = () => {
  const [isParsing, setIsParsing] = useState(false);

  const parseProduct = async (input: string) => {
    setIsParsing(true);
    try {
      // Use new endpoint that detects store
      const result = await client.shopping.parseProductWithStore({ input });
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  return { parseProduct, isParsing };
};
```

**Step 2: Commit**

```bash
git add apps/native/hooks/shopping/useProductParser.ts
git commit -m "feat(parser): update to parse store from natural language"
```

---

## Task 8: Update Main Screen for Store Filtering

**Files:**
- Modify: `apps/native/app/(app)/index.tsx`

**Step 1: Import useFilteredProducts instead of useProducts**

```typescript
import { 
  useStores, 
  useCategories, 
  useFilteredProducts, // CHANGED from useProducts
  useStoreCategoryOrders, 
  useAddProduct, 
  useToggleProduct, 
  useClearPurchased 
} from '@/hooks/shopping/useShopping';
```

**Step 2: Update to use filtered products**

```typescript
export default function ShoppingListScreen() {
  const router = useRouter();
  const [productInput, setProductInput] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: categories = [] } = useCategories();
  // Use filtered products based on selected store
  const { data: products = [] } = useFilteredProducts(selectedStoreId);
  const { data: storeCategoryOrders = [] } = useStoreCategoryOrders(selectedStoreId);
  
  // ... rest of component
}
```

**Step 3: Update handleAddProduct to pass assignedStoreId**

```typescript
const handleAddProduct = async () => {
  if (!productInput.trim()) return;

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const parsed = await parseProduct(productInput);
  if (!parsed) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }

  const category = categories.find(
    (c: Category) => c.name.toLowerCase() === parsed.category.toLowerCase()
  );

  if (!category) {
    console.error('Category not found:', parsed.category);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }

  await addProductMutation.mutateAsync({
    name: parsed.name,
    qty: parsed.qty,
    unit: parsed.unit,
    note: parsed.note,
    categoryId: category.id,
    assignedStoreId: parsed.assignedStoreId || null, // NEW: Pass store from AI parsing
  });

  setProductInput('');
};
```

**Step 4: Commit**

```bash
git add apps/native/app/(app)/index.tsx
git commit -m "feat(screen): filter products by store and pass store to addProduct"
```

---

## Task 9: Update Edit Product Modal

**Files:**
- Modify: `apps/native/app/(app)/edit-product.tsx`

**Step 1: Add store selector to edit modal**

```typescript
// Add to imports
import { Store } from '@/types/shopping';

// Add to state
const [assignedStoreId, setAssignedStoreId] = useState<string | null>(null);
const [showStorePicker, setShowStorePicker] = useState(false);

// In useEffect
useEffect(() => {
  if (product) {
    // ... existing state setters
    setAssignedStoreId(product.assignedStoreId);
  }
}, [product]);

// In handleSave
await updateProductMutation.mutateAsync({
  productId: id,
  name: name.trim(),
  qty: qty ? parseInt(qty, 10) : null,
  unit: unit.trim() || null,
  note: note.trim() || null,
  categoryId: selectedCategoryId,
  assignedStoreId: assignedStoreId || null, // NEW
});

// Add store picker section after Category
const assignedStore = stores.find((s: Store) => s.id === assignedStoreId);

// Add JSX after Category section:
<Card className="p-4 mt-4">
  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
    Przypisanie do sklepu
  </Text>
  <Pressable
    onPress={() => {
      setShowStorePicker(!showStorePicker);
      setShowCategoryPicker(false);
    }}
    className="flex-row items-center justify-between py-2 border-b border-gray-200"
  >
    <Text className={`text-base ${assignedStore ? 'text-gray-900' : 'text-gray-400'}`}>
      {assignedStore?.name ?? 'Wszystkie sklepy (globalny)'}
    </Text>
    <Text className="text-gray-400 text-lg">{showStorePicker ? '▲' : '▼'}</Text>
  </Pressable>

  {showStorePicker && (
    <View className="mt-2 bg-gray-50 rounded-xl p-2">
      <Pressable
        onPress={() => {
          setAssignedStoreId(null);
          setShowStorePicker(false);
        }}
        className={`py-3 px-4 rounded-lg mb-1 ${
          !assignedStoreId ? 'bg-blue-500' : 'bg-white'
        }`}
      >
        <Text className={`font-medium ${!assignedStoreId ? 'text-white' : 'text-gray-700'}`}>
          Wszystkie sklepy
        </Text>
      </Pressable>
      {stores.map((store: Store) => (
        <Pressable
          key={store.id}
          onPress={() => {
            setAssignedStoreId(store.id);
            setShowStorePicker(false);
          }}
          className={`py-3 px-4 rounded-lg mb-1 ${
            assignedStoreId === store.id ? 'bg-blue-500' : 'bg-white'
          }`}
        >
          <Text
            className={`font-medium ${
              assignedStoreId === store.id ? 'text-white' : 'text-gray-700'
            }`}
          >
            {store.name}
          </Text>
        </Pressable>
      ))}
    </View>
  )}
</Card>
```

**Step 2: Commit**

```bash
git add apps/native/app/(app)/edit-product.tsx
git commit -m "feat(edit): add store assignment selector to product edit modal"
```

---

## Task 10: Create Exception Store Management Screen

**Files:**
- Create: `apps/native/app/(app)/settings/stores.tsx`

```typescript
import { useState } from 'react';
import { View, ScrollView, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { Button, Card } from 'heroui-native';
import { useStores, useCreateExceptionStore } from '@/hooks/shopping/useShopping';
import { Store } from '@/types/shopping';

export default function ManageStoresScreen() {
  const { data: stores = [] } = useStores();
  const createStoreMutation = useCreateExceptionStore();
  
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreKeywords, setNewStoreKeywords] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;
    
    await createStoreMutation.mutateAsync({
      name: newStoreName.trim(),
      keywords: newStoreKeywords.trim(),
    });
    
    setNewStoreName('');
    setNewStoreKeywords('');
    setShowAddForm(false);
  };

  const exceptionStores = stores.filter((s: Store) => s.keywords);
  const regularStores = stores.filter((s: Store) => !s.keywords);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Zarządzaj sklepami' }} />
      
      <ScrollView className="flex-1 p-4">
        {/* Regular Stores */}
        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 ml-1">
          Sklepy standardowe
        </Text>
        <Card className="p-4 mb-6">
          {regularStores.map((store: Store) => (
            <View key={store.id} className="py-3 border-b border-gray-100 last:border-b-0">
              <Text className="text-base font-medium text-gray-900">{store.name}</Text>
            </View>
          ))}
        </Card>

        {/* Exception Stores */}
        <View className="flex-row items-center justify-between mb-3 ml-1">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Sklepy wyjątkowe
          </Text>
          <Button size="sm" onPress={() => setShowAddForm(!showAddForm)}>
            <Button.Label>{showAddForm ? 'Anuluj' : 'Dodaj'}</Button.Label>
          </Button>
        </View>

        {showAddForm && (
          <Card className="p-4 mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Nazwa sklepu</Text>
            <TextInput
              value={newStoreName}
              onChangeText={setNewStoreName}
              placeholder="np. DELI, Piekarnia"
              className="text-base text-gray-900 pb-2 border-b border-gray-200 mb-4"
            />
            
            <Text className="text-sm font-medium text-gray-600 mb-2">Słowa kluczowe (AI)</Text>
            <TextInput
              value={newStoreKeywords}
              onChangeText={setNewStoreKeywords}
              placeholder="deli, z deli, delikatesy"
              className="text-base text-gray-900 pb-2 border-b border-gray-200 mb-2"
            />
            <Text className="text-xs text-gray-400 mb-4">
              AI rozpozna te słowa w inpucie użytkownika
            </Text>
            
            <Button
              onPress={handleCreateStore}
              isDisabled={!newStoreName.trim() || createStoreMutation.isPending}
            >
              <Button.Label>Utwórz sklep</Button.Label>
            </Button>
          </Card>
        )}

        <Card className="p-4">
          {exceptionStores.length === 0 ? (
            <Text className="text-gray-400 text-center py-4">
              Brak sklepów wyjątkowych
            </Text>
          ) : (
            exceptionStores.map((store: Store) => (
              <View key={store.id} className="py-3 border-b border-gray-100 last:border-b-0">
                <Text className="text-base font-medium text-gray-900">{store.name}</Text>
                {store.keywords && (
                  <Text className="text-sm text-gray-500 mt-1">
                    Słowa kluczowe: {store.keywords}
                  </Text>
                )}
              </View>
            ))
          )}
        </Card>

        {/* Info */}
        <Card className="p-4 mt-6 bg-blue-50">
          <Text className="text-sm text-blue-800">
            💡 W sklepach wyjątkowych pokazują się tylko produkty przypisane do nich. 
            Produkty globalne są widoczne we wszystkich sklepach.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
```

**Step 2: Add route to layout**

```typescript
// In apps/native/app/(app)/_layout.tsx
<Stack.Screen
  name="settings/stores"
  options={{ title: "Zarządzaj sklepami" }}
/>
```

**Step 3: Add link in Settings screen**

```typescript
// In apps/native/app/(app)/settings/index.tsx
<Pressable
  onPress={() => router.push('/settings/stores')}
  className="flex-row items-center justify-between p-4 bg-white rounded-xl mb-3"
>
  <View>
    <Text className="text-base font-medium text-gray-900">Sklepy wyjątkowe</Text>
    <Text className="text-sm text-gray-500">Zarządzaj sklepami i słowami kluczowymi</Text>
  </View>
  <Text className="text-gray-400">›</Text>
</Pressable>
```

**Step 4: Commit**

```bash
git add apps/native/app/(app)/settings/stores.tsx
git add apps/native/app/(app)/_layout.tsx
git add apps/native/app/(app)/settings/index.tsx
git commit -m "feat(settings): add exception store management screen"
```

---

## Task 11: Test and Verify

**Step 1: Run type check**

```bash
cd /Users/rafal/workspace/listonic
npm run check-types
```

Expected: All types pass

**Step 2: Test scenarios**

1. Add product without store keyword → should appear in all stores
2. Add product "kawa z DELI" (after creating DELI store) → should only appear in DELI
3. Edit product to change store assignment → should move between stores
4. View regular store (Biedronka) → should see global + Biedronka-specific products
5. View exception store (DELI) → should see only DELI products

**Step 3: Final commit**

```bash
git commit -m "feat(exception-stores): complete implementation of store-specific products"
```

---

## Summary

**New Concepts Added:**
1. Products can be assigned to specific stores (or global)
2. Exception stores only show their assigned products
3. AI parses store keywords from natural language ("z DELI", "z piekarni")
4. Users can create custom exception stores with keywords

**Key Changes:**
- Database: `assignedStoreId` on products, `keywords` on stores
- API: Enhanced parser to detect stores, new createExceptionStore endpoint
- UI: Store filtering on main screen, store picker in edit modal, store management screen
- Logic: Filter products based on current store selection
