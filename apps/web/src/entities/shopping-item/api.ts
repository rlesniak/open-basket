import {
  categories,
  categoryMappings,
  db,
  shoppingItems,
} from "@open-basket/db";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from "./model";

export const getShoppingItems = createServerFn({ method: "GET" }).handler(
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

export const createShoppingItem = createServerFn({ method: "POST" }).handler(
  async (ctx) => {
    const data = (ctx as unknown as { data: CreateShoppingItemInput }).data;
    const result = await db
      .insert(shoppingItems)
      .values({
        name: data.name,
        quantity: data.quantity,
        categoryId: data.categoryId,
        note: data.note,
        status: "pending",
      })
      .returning();
    return result[0];
  }
);

export const updateShoppingItem = createServerFn({ method: "POST" }).handler(
  async (ctx) => {
    const { id, input } = (
      ctx as unknown as {
        data: { id: string; input: UpdateShoppingItemInput };
      }
    ).data;

    // If category changed, update learning
    if (input.categoryId && input.name) {
      await updateCategoryMapping(input.name, input.categoryId);
    }

    const result = await db
      .update(shoppingItems)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(shoppingItems.id, id))
      .returning();
    return result[0];
  }
);

export const deleteShoppingItem = createServerFn({ method: "POST" }).handler(
  async (ctx) => {
    const id = (ctx as unknown as { data: string }).data;
    await db.delete(shoppingItems).where(eq(shoppingItems.id, id));
  }
);

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
