import { db, stores } from "@open-basket/db";
import { createServerFn } from "@tanstack/react-start";

export const getStores = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(stores).orderBy(stores.name);
});

export const getStoreWithCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    // This will be called with data parameter from the client
    return null;
  }
);

export const createStore = createServerFn({ method: "POST" }).handler(
  async () => {
    return null;
  }
);

export const updateCategoryOrder = createServerFn({ method: "POST" }).handler(
  async () => {
    return null;
  }
);
