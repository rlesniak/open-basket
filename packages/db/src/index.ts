import { createClient } from "@libsql/client";
import { env } from "@open-basket/env/server";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

export {
  type Category,
  categories,
  defaultCategories,
  type NewCategory,
} from "./schema/categories.js";
export {
  type CategoryMapping,
  categoryMappings,
  type NewCategoryMapping,
} from "./schema/category-mappings.js";
export {
  type ItemStatus,
  itemStatusEnum,
  type NewShoppingItem,
  type ShoppingItem,
  shoppingItems,
} from "./schema/shopping-items.js";
export {
  type NewStoreCategory,
  type StoreCategory,
  storeCategories,
} from "./schema/store-categories.js";
export { type NewStore, type Store, stores } from "./schema/stores.js";

import { categories, defaultCategories } from "./schema/categories.js";
import { storeCategories } from "./schema/store-categories.js";
import { stores } from "./schema/stores.js";

const legacyCategoryIcons = new Set([
  "apple",
  "milk",
  "meat",
  "bread",
  "package",
  "snowflake",
  "bottle",
  "sparkles",
  "box",
]);

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
  } else {
    for (const defaultCategory of defaultCategories) {
      const existingCategory = existingCategories.find(
        (category) => category.name === defaultCategory.name
      );

      if (!existingCategory) {
        await db.insert(categories).values(defaultCategory);
        continue;
      }

      if (
        existingCategory.icon == null ||
        legacyCategoryIcons.has(existingCategory.icon)
      ) {
        await db
          .update(categories)
          .set({ icon: defaultCategory.icon })
          .where(eq(categories.id, existingCategory.id));
      }
    }
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
