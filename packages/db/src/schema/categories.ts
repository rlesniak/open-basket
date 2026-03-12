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
  { name: "Warzywa i owoce", icon: "🥦", color: "#22c55e" },
  { name: "Nabiał", icon: "🧀", color: "#3b82f6" },
  { name: "Mięso i ryby", icon: "🥩", color: "#ef4444" },
  { name: "Piekarnia", icon: "🥖", color: "#f59e0b" },
  { name: "Suche produkty", icon: "📦", color: "#8b5cf6" },
  { name: "Mrożonki", icon: "🧊", color: "#06b6d4" },
  { name: "Napoje", icon: "🧃", color: "#ec4899" },
  { name: "Chemia", icon: "🧼", color: "#6366f1" },
  { name: "Inne", icon: "🛒", color: "#6b7280" },
];
