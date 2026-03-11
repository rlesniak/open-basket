import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { categories } from "./categories";
import { stores } from "./stores";

export const storeCategories = sqliteTable(
  "store_categories",
  {
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.storeId, table.categoryId] }),
  })
);

export type StoreCategory = typeof storeCategories.$inferSelect;
export type NewStoreCategory = typeof storeCategories.$inferInsert;
