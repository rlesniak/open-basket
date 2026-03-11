import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { categories } from "./categories.js";

export const categoryMappings = sqliteTable("category_mappings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  inputPattern: text("input_pattern").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  frequency: integer("frequency").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type CategoryMapping = typeof categoryMappings.$inferSelect;
export type NewCategoryMapping = typeof categoryMappings.$inferInsert;
