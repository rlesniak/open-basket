import type { categories } from "@open-basket/db/schema/categories";

export type Category = typeof categories.$inferSelect;

export interface CategoryWithPosition extends Category {
  position: number;
}
