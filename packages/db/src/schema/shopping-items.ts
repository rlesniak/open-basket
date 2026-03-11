import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { categories } from "./categories.js";

export const itemStatusEnum = ["pending", "purchased", "cancelled"] as const;
export type ItemStatus = (typeof itemStatusEnum)[number];

export const shoppingItems = sqliteTable("shopping_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  quantity: text("quantity"),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set default",
  }),
  note: text("note"),
  status: text("status", { enum: itemStatusEnum })
    .notNull()
    .$defaultFn(() => "pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type NewShoppingItem = typeof shoppingItems.$inferInsert;
