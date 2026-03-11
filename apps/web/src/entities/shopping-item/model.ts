import type { categories, shoppingItems } from "@open-basket/db";

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type NewShoppingItem = typeof shoppingItems.$inferInsert;
export type { ItemStatus } from "@open-basket/db";

export type Category = typeof categories.$inferSelect;

export interface ShoppingItemWithCategory extends ShoppingItem {
  category: Category | null;
}

export type CreateShoppingItemInput = {
  name: string;
  quantity?: string | null;
  categoryId?: string | null;
  note?: string | null;
};

export type UpdateShoppingItemInput = Partial<CreateShoppingItemInput> & {
  status?: "pending" | "purchased" | "cancelled";
};
