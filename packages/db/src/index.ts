import { createClient } from "@libsql/client";
import { env } from "@open-basket/env/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

export * from "./schema/index.js";

import { categories, defaultCategories } from "./schema/categories.js";
import { storeCategories } from "./schema/store-categories.js";
import { stores } from "./schema/stores.js";

const client = createClient({
  url: env.DATABASE_URL,
});

export const db = drizzle({ client });

export async function seedDatabase() {
  // Check if categories already exist
  const existingCategories = await db.select().from(categories);

  if (existingCategories.length === 0) {
    // Insert default categories
    await db.insert(categories).values(defaultCategories);
  }

  // Check if default store exists
  const existingStores = await db
    .select()
    .from(stores)
    .where(eq(stores.name, "Mój sklep"));

  let defaultStoreId: string;

  if (existingStores.length === 0) {
    // Create default store
    const result = await db
      .insert(stores)
      .values({ name: "Mój sklep" })
      .returning();
    const store = result[0];
    if (!store) {
      throw new Error("Failed to create default store");
    }
    defaultStoreId = store.id;

    // Link all categories to default store with default order
    const allCategories = await db.select().from(categories);
    const storeCategoryLinks = allCategories.map((category, index) => ({
      storeId: defaultStoreId,
      categoryId: category.id,
      position: index,
    }));

    if (storeCategoryLinks.length > 0) {
      await db.insert(storeCategories).values(storeCategoryLinks);
    }
  }
}
