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

export const createShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((data: CreateShoppingItemInput) => data)
  .handler(async ({ data }) => {
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
  });

export const updateShoppingItem = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { id: string; input: UpdateShoppingItemInput }) => data
  )
  .handler(async ({ data }) => {
    const { id, input } = data;

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
  });

export const deleteShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
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
