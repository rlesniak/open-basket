import { db } from "@open-basket/db";
import { categories } from "@open-basket/db/schema/categories";
import { createServerFn } from "@tanstack/react-start";

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const result = await db.select().from(categories).orderBy(categories.name);
    return result;
  }
);
