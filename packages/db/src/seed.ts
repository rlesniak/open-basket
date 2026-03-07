import { db } from './client';
import { stores, categories, storeCategoryOrders, DEFAULT_STORES, DEFAULT_CATEGORIES } from './schema';

export async function seedDatabase() {
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
