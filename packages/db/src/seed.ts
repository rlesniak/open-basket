import { db } from './client';
import { stores, categories, storeCategoryOrders, DEFAULT_STORES, DEFAULT_CATEGORIES } from './schema';
import { notInArray } from 'drizzle-orm';

export async function seedDatabase() {
  // Clean up old data with non-existent category IDs
  const validCategoryIds = DEFAULT_CATEGORIES.map(c => c.id);
  await db.delete(storeCategoryOrders).where(notInArray(storeCategoryOrders.categoryId, validCategoryIds));
  await db.delete(categories).where(notInArray(categories.id, validCategoryIds));

  // Insert stores
  for (const store of DEFAULT_STORES) {
    await db.insert(stores).values(store).onConflictDoNothing();
  }

  // Insert categories
  for (const category of DEFAULT_CATEGORIES) {
    await db.insert(categories).values(category).onConflictDoNothing();
  }

  // Initialize category orders for each store
  for (const store of DEFAULT_STORES) {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const category = DEFAULT_CATEGORIES[i];
      if (!category) continue;
      await db.insert(storeCategoryOrders).values({
        storeId: store.id,
        categoryId: category.id,
        orderIndex: i,
      }).onConflictDoNothing();
    }
  }
}
