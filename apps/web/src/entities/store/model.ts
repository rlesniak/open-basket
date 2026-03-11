import type { categories } from "@open-basket/db/schema/categories";
import type { stores } from "@open-basket/db/schema/stores";

export type Store = typeof stores.$inferSelect;
export type Category = typeof categories.$inferSelect;

export interface StoreWithCategories extends Store {
  categories: Array<{
    category: Category;
    position: number;
  }>;
}
