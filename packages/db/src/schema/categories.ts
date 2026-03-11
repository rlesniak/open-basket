import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export const defaultCategories = [
  { name: "Warzywa i owoce", icon: "apple", color: "#22c55e" },
  { name: "Nabiał", icon: "milk", color: "#3b82f6" },
  { name: "Mięso i ryby", icon: "meat", color: "#ef4444" },
  { name: "Piekarnia", icon: "bread", color: "#f59e0b" },
  { name: "Suche produkty", icon: "package", color: "#8b5cf6" },
  { name: "Mrożonki", icon: "snowflake", color: "#06b6d4" },
  { name: "Napoje", icon: "bottle", color: "#ec4899" },
  { name: "Chemia", icon: "sparkles", color: "#6366f1" },
  { name: "Inne", icon: "box", color: "#6b7280" },
];
