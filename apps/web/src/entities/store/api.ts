import { categories, db, storeCategories, stores } from "@open-basket/db";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";

export const getStores = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(stores).orderBy(stores.name);
});

export const getStoreWithCategories = createServerFn({ method: "GET" })
  .inputValidator((storeId: string) => storeId)
  .handler(async ({ data: storeId }) => {
    const store = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .get();
    if (!store) {
      return null;
    }

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

export const createStore = createServerFn({ method: "POST" })
  .inputValidator((name: string) => name)
  .handler(async ({ data: name }) => {
    const allCategories = await db.select().from(categories);

    const store = await db.insert(stores).values({ name }).returning().get();

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

export const updateCategoryOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { storeId: string; categoryId: string; position: number }) => data
  )
  .handler(async ({ data }) => {
    const { storeId, categoryId, position } = data;
    await db
      .update(storeCategories)
      .set({ position })
      .where(
        and(
          eq(storeCategories.storeId, storeId),
          eq(storeCategories.categoryId, categoryId)
        )
      );
  });
