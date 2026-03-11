import { categories, db } from "@open-basket/db";
import { createServerFn } from "@tanstack/react-start";

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    return db.select().from(categories).orderBy(categories.name);
  }
);
